import { useState, useEffect, type JSX } from 'react'
import { createPortal } from 'react-dom'
import { FileTextIcon, ZapIcon, SparkleIcon, CopyIcon, MicIcon } from '@/components/ui/icons'

interface LegalSelectionToolbarProps {
  onAction?: (actionType: string, selectedText: string) => void
}

export function LegalSelectionToolbar({ onAction }: LegalSelectionToolbarProps): JSX.Element | null {
  const [selectedText, setSelectedText] = useState('')
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    function handleSelectionChange(): void {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setPosition(null)
        setSelectedText('')
        return
      }

      const text = selection.toString().trim()
      if (text.length < 5) {
        setPosition(null)
        setSelectedText('')
        return
      }

      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      if (rect.width > 0 && rect.height > 0) {
        setSelectedText(text)
        setPosition({
          top: Math.max(10, rect.top + window.scrollY - 48),
          left: Math.min(window.innerWidth - 380, Math.max(10, rect.left + window.scrollX + rect.width / 2 - 190)),
        })
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [])

  if (!position || !selectedText) return null

  const handleQuickAction = (actionType: string): void => {
    if (onAction) {
      onAction(actionType, selectedText)
    }
    // Reset selection after trigger
    window.getSelection()?.removeAllRanges()
    setPosition(null)
  }

  return createPortal(
    <div
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="fixed z-50 flex items-center gap-xs rounded-full border border-accent/40 bg-paper-1/95 px-sm py-[4px] shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150"
    >
      <span className="text-[0.68rem] font-bold text-accent-text tracking-wider uppercase px-xs border-r border-rule-2 flex items-center gap-xs">
        <SparkleIcon className="h-3 w-3 text-accent animate-pulse" />
        Legal AI
      </span>

      <button
        type="button"
        onClick={() => handleQuickAction('ratio')}
        className="flex items-center gap-xs rounded-full px-xs py-[2px] text-xs font-medium text-ink hover:bg-accent-soft/40 hover:text-accent-text transition-colors"
        title="Extract Ratio Decidendi"
      >
        <FileTextIcon className="h-3.5 w-3.5 text-accent" />
        Ratio
      </button>

      <button
        type="button"
        onClick={() => handleQuickAction('counter')}
        className="flex items-center gap-xs rounded-full px-xs py-[2px] text-xs font-medium text-ink hover:bg-amber-500/20 hover:text-amber-300 transition-colors"
        title="Find Counter Precedents"
      >
        <ZapIcon className="h-3.5 w-3.5 text-amber-400" />
        Counter Cases
      </button>

      <button
        type="button"
        onClick={() => handleQuickAction('bns')}
        className="flex items-center gap-xs rounded-full px-xs py-[2px] text-xs font-medium text-ink hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
        title="Convert IPC ➔ BNS Section"
      >
        <span>⚖️ BNS</span>
      </button>

      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(selectedText)
          handleQuickAction('copy')
        }}
        className="flex items-center gap-xs rounded-full p-[4px] text-muted hover:bg-paper-3 hover:text-ink transition-colors"
        title="Copy Selected Legal Text"
      >
        <CopyIcon className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => handleQuickAction('voice')}
        className="flex items-center gap-xs rounded-full p-[4px] text-muted hover:bg-paper-3 hover:text-accent-text transition-colors"
        title="Sarvam AI Indic Dictation Reading"
      >
        <MicIcon className="h-3.5 w-3.5" />
      </button>
    </div>,
    document.body
  )
}
