/**
 * Lightweight client-side previews for Office Open XML (DOCX / XLSX) and CSV.
 */

import JSZip from 'jszip'

const MAX_DOCX_PARAGRAPHS = 500
const MAX_SPREADSHEET_ROWS = 200
const MAX_SPREADSHEET_COLS = 50

export interface SpreadsheetPreview {
  rows: string[][]
  truncated: boolean
  totalRows?: number
  totalCols?: number
}

export type OfficePreviewResult =
  | { kind: 'docx'; paragraphs: string[]; truncated: boolean }
  | { kind: 'spreadsheet'; table: SpreadsheetPreview }

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function stripXmlTags(xml: string): string {
  return decodeXmlEntities(xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
}

async function readZipEntry(zip: JSZip, path: string): Promise<string | null> {
  const entry = zip.file(path)
  if (!entry) return null
  return entry.async('string')
}

function extractDocxParagraph(pXml: string): string {
  const parts: string[] = []
  const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/gi
  let tMatch: RegExpExecArray | null
  while ((tMatch = tRegex.exec(pXml)) !== null) {
    const raw = tMatch[1] ?? ''
    if (raw) parts.push(decodeXmlEntities(raw))
  }
  return parts.join('').trim()
}

function parseDocxDocumentXml(xml: string): string[] {
  const paragraphs: string[] = []
  const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/gi
  let match: RegExpExecArray | null
  while ((match = pRegex.exec(xml)) !== null) {
    const line = extractDocxParagraph(match[0])
    if (line) paragraphs.push(line)
    if (paragraphs.length >= MAX_DOCX_PARAGRAPHS) break
  }
  if (paragraphs.length === 0) {
    const fallback = stripXmlTags(xml)
    if (fallback) paragraphs.push(fallback.slice(0, 8000))
  }
  return paragraphs
}

export async function previewDocxFromBlob(blob: Blob): Promise<OfficePreviewResult> {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer())
  const docXml = await readZipEntry(zip, 'word/document.xml')
  if (!docXml) throw new Error('Invalid DOCX: missing word/document.xml')
  const paragraphs = parseDocxDocumentXml(docXml)
  const truncated = /<w:p[\s>]/gi.test(docXml) && paragraphs.length >= MAX_DOCX_PARAGRAPHS
  return {
    kind: 'docx',
    paragraphs: paragraphs.length ? paragraphs : ['(Empty document)'],
    truncated,
  }
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = []
  const siRegex = /<si[\s>][\s\S]*?<\/si>/gi
  let match: RegExpExecArray | null
  while ((match = siRegex.exec(xml)) !== null) {
    const si = match[0]
    const tRegex = /<t[^>]*>([\s\S]*?)<\/t>/gi
    const parts: string[] = []
    let tMatch: RegExpExecArray | null
    while ((tMatch = tRegex.exec(si)) !== null) {
      parts.push(decodeXmlEntities(tMatch[1] ?? ''))
    }
    strings.push(parts.join('') || stripXmlTags(si))
  }
  return strings
}

function colIndexFromRef(ref: string): number {
  const letters = ref.replace(/[0-9]/g, '').toUpperCase()
  let n = 0
  for (let i = 0; i < letters.length; i++) n = n * 26 + (letters.charCodeAt(i) - 64)
  return Math.max(0, n - 1)
}

function rowIndexFromRef(ref: string): number {
  const digits = ref.replace(/[^0-9]/g, '')
  return Math.max(0, parseInt(digits, 10) - 1)
}

function cellTextFromMatch(
  attrs: string,
  value: string,
  fullMatch: string,
  sharedStrings: string[],
): string {
  const tMatch = /\st="([^"]+)"/.exec(attrs)
  const cellType = tMatch?.[1]
  let text = value.trim()
  if (cellType === 's' && sharedStrings.length) {
    const idx = parseInt(text, 10)
    return Number.isFinite(idx) ? (sharedStrings[idx] ?? '') : ''
  }
  if (cellType === 'inlineStr') {
    const inline = /<t[^>]*>([\s\S]*?)<\/t>/.exec(fullMatch)
    return inline ? decodeXmlEntities(inline[1]) : stripXmlTags(fullMatch)
  }
  return decodeXmlEntities(text)
}

function parseSheetCells(
  sheetXml: string,
  sharedStrings: string[],
): Map<string, string> {
  const sparse = new Map<string, string>()
  const rowRegex = /<row[^>]*\sr="(\d+)"[^>]*>([\s\S]*?)<\/row>/gi
  let rowMatch: RegExpExecArray | null
  while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
    const rowNum = parseInt(rowMatch[1], 10)
    const cellRegex = /<c\s([^>]*)\/?>(?:<v>([\s\S]*?)<\/v>)?/gi
    let cellMatch: RegExpExecArray | null
    while ((cellMatch = cellRegex.exec(rowMatch[2])) !== null) {
      const attrs = cellMatch[1]
      const rMatch = /\sr="([^"]+)"/.exec(attrs)
      const ref = rMatch?.[1] ?? `A${rowNum}`
      const text = cellTextFromMatch(attrs, cellMatch[2] ?? '', cellMatch[0], sharedStrings)
      sparse.set(`${rowNum - 1},${colIndexFromRef(ref)}`, text)
    }
  }
  if (sparse.size === 0) fillSparseFromFlatCells(sheetXml, sharedStrings, sparse)
  return sparse
}

function fillSparseFromFlatCells(
  sheetXml: string,
  sharedStrings: string[],
  sparse: Map<string, string>,
): void {
  const cellRegex = /<c\s([^>]*)\/?>(?:<v>([\s\S]*?)<\/v>)?/gi
  let cellMatch: RegExpExecArray | null
  while ((cellMatch = cellRegex.exec(sheetXml)) !== null) {
    const attrs = cellMatch[1]
    const rMatch = /\sr="([^"]+)"/.exec(attrs)
    const ref = rMatch?.[1] ?? 'A1'
    const text = cellTextFromMatch(attrs, cellMatch[2] ?? '', cellMatch[0], sharedStrings)
    sparse.set(`${rowIndexFromRef(ref)},${colIndexFromRef(ref)}`, text)
  }
}

function sparseToRows(sparse: Map<string, string>): {
  rows: string[][]
  maxRow: number
  maxCol: number
} {
  let maxRow = 0
  let maxCol = 0
  for (const key of sparse.keys()) {
    const [r, c] = key.split(',').map(Number)
    maxRow = Math.max(maxRow, r)
    maxCol = Math.max(maxCol, c)
  }
  const rowCount = Math.min(maxRow + 1, MAX_SPREADSHEET_ROWS)
  const colCount = Math.min(maxCol + 1, MAX_SPREADSHEET_COLS)
  const rows: string[][] = []
  for (let r = 0; r < rowCount; r++) {
    const row: string[] = []
    for (let c = 0; c < colCount; c++) row.push(sparse.get(`${r},${c}`) ?? '')
    rows.push(row)
  }
  return { rows, maxRow: maxRow + 1, maxCol: maxCol + 1 }
}

async function findFirstWorksheetPath(zip: JSZip): Promise<string | null> {
  const names = Object.keys(zip.files).filter(
    (n) => n.startsWith('xl/worksheets/sheet') && n.endsWith('.xml'),
  )
  names.sort()
  return names[0] ?? null
}

export async function previewXlsxFromBlob(blob: Blob): Promise<OfficePreviewResult> {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer())
  const sheetPath = await findFirstWorksheetPath(zip)
  if (!sheetPath) throw new Error('Invalid XLSX: no worksheet found')
  const sheetXml = await readZipEntry(zip, sheetPath)
  if (!sheetXml) throw new Error('Invalid XLSX: could not read worksheet')
  const sharedXml = await readZipEntry(zip, 'xl/sharedStrings.xml')
  const sharedStrings = sharedXml ? parseSharedStrings(sharedXml) : []
  const { rows, maxRow, maxCol } = sparseToRows(parseSheetCells(sheetXml, sharedStrings))
  return {
    kind: 'spreadsheet',
    table: {
      rows: rows.length ? rows : [['(Empty sheet)']],
      truncated: maxRow > MAX_SPREADSHEET_ROWS || maxCol > MAX_SPREADSHEET_COLS,
      totalRows: maxRow,
      totalCols: maxCol,
    },
  }
}

function parseCsvText(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cell += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === ',' && !inQuotes) {
      row.push(cell)
      cell = ''
      continue
    }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      continue
    }
    cell += ch
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

export async function previewCsvFromBlob(blob: Blob): Promise<OfficePreviewResult> {
  const parsedRows = parseCsvText(await blob.text())
  const maxCols = parsedRows.reduce((max, r) => Math.max(max, r.length), 0)
  const cappedRowCount = Math.min(parsedRows.length, MAX_SPREADSHEET_ROWS)
  const cappedColCount = Math.min(maxCols, MAX_SPREADSHEET_COLS)
  const rows = Array.from({ length: cappedRowCount }, (_, rowIdx) => {
    const source = parsedRows[rowIdx] ?? []
    return Array.from({ length: cappedColCount }, (_, colIdx) => source[colIdx] ?? '')
  })
  return {
    kind: 'spreadsheet',
    table: {
      rows: rows.length ? rows : [['(Empty sheet)']],
      truncated: parsedRows.length > MAX_SPREADSHEET_ROWS || maxCols > MAX_SPREADSHEET_COLS,
      totalRows: parsedRows.length,
      totalCols: maxCols,
    },
  }
}

export async function previewOfficeBlob(
  blob: Blob,
  format: 'docx' | 'xlsx' | 'csv',
): Promise<OfficePreviewResult> {
  if (format === 'docx') return previewDocxFromBlob(blob)
  if (format === 'csv') return previewCsvFromBlob(blob)
  return previewXlsxFromBlob(blob)
}
