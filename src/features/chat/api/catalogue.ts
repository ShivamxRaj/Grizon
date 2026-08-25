import { apiFetch } from '@/lib/api/client'
import { parseCatalogueResponse } from './guards'
import type { CatalogueResponse } from './types'

const BASE = '/api/v1/catalogue'

const MOCK_CATALOGUE: CatalogueResponse = {
  categories: [
    {
      id: 'cat_legal',
      name: 'Legal & Indian Law',
      slug: 'legal-law',
      description: 'Specialized legal intelligence for Indian Law, BNS, and contract analysis',
      agents: [
        {
          id: 'ag_legal_1',
          name: 'Legal Counsel Agent',
          displayName: 'Legal Counsel',
          slug: 'legal-counsel',
          shortDescription: 'Statutory lens, case law analysis & BNS/IPC transition mapping',
          agentType: 'legal',
          iconUrl: null,
        },
        {
          id: 'ag_legal_2',
          name: 'Contract Auditor',
          displayName: 'Contract Auditor',
          slug: 'contract-auditor',
          shortDescription: 'Clause extraction, liability risk flags & legal compliance check',
          agentType: 'legal',
          iconUrl: null,
        },
      ],
    },
    {
      id: 'cat_reasoning',
      name: 'Deep Intelligence',
      slug: 'deep-reasoning',
      description: 'Advanced multi-stage reasoning and document intelligence',
      agents: [
        {
          id: 'ag_deep_1',
          name: 'Deep Reasoner',
          displayName: 'Deep Reasoner',
          slug: 'deep-reasoner',
          shortDescription: 'Multi-hop synthesis, zero-hallucination validation & deep analysis',
          agentType: 'reasoner',
          iconUrl: null,
        },
        {
          id: 'ag_ocr_1',
          name: 'Zero-Hallucination OCR',
          displayName: 'Document OCR Scanner',
          slug: 'document-ocr',
          shortDescription: 'High-fidelity PDF parsing, table extraction & bilingual scan',
          agentType: 'ocr',
          iconUrl: null,
        },
      ],
    },
    {
      id: 'cat_code',
      name: 'Engineering & Code',
      slug: 'engineering-code',
      description: 'Software architecture, full-stack coding & API design',
      agents: [
        {
          id: 'ag_code_1',
          name: 'Code Architect',
          displayName: 'Code Architect',
          slug: 'code-architect',
          shortDescription: 'Clean code refactoring, TypeScript, React & system design',
          agentType: 'code',
          iconUrl: null,
        },
      ],
    },
  ],
}

export async function fetchCatalogue(): Promise<CatalogueResponse> {
  try {
    return await apiFetch(BASE, { auth: true, method: 'GET' }, parseCatalogueResponse)
  } catch {
    return MOCK_CATALOGUE
  }
}
