import { useState, type JSX } from 'react'
import { FileTextIcon, CheckCircleIcon, CopyIcon, ExternalLinkIcon, SearchIcon } from '@/components/ui/icons'

export function LegalWorkbenchCanvas(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'statute' | 'draft' | 'citator'>('statute')
  const [searchFilter, setSearchFilter] = useState('')

  const statutoryMappings = [
    { ipc: 'IPC Section 302', bns: 'BNS Section 103', title: 'Punishment for Murder', change: 'Enhanced fine & community service options', signal: 'CRITICAL' },
    { ipc: 'IPC Section 420', bns: 'BNS Section 318', title: 'Cheating & Dishonestly Inducing Delivery', change: 'Includes digital financial fraud penalties', signal: 'UPDATED' },
    { ipc: 'IPC Section 376', bns: 'BNS Section 64', title: 'Punishment for Rape', change: 'Gender-neutral child protection additions', signal: 'CRITICAL' },
    { ipc: 'IPC Section 124A', bns: 'BNS Section 152', title: 'Acts Endangering Sovereignty of India', change: 'Sedition replaced with offences against State integrity', signal: 'REFORMED' },
    { ipc: 'IPC Section 498A', bns: 'BNS Section 85', title: 'Husband/Relative Subjecting Woman to Cruelty', change: 'Mandatory pre-arrest reconciliation timeline', signal: 'UPDATED' },
  ]

  const filteredMappings = statutoryMappings.filter(
    (item) =>
      item.ipc.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.bns.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.title.toLowerCase().includes(searchFilter.toLowerCase())
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-paper-1">
      {/* Workbench Navigation Header */}
      <div className="flex items-center justify-between border-b border-rule-2 bg-paper-2 px-md py-xs text-xs">
        <div className="flex items-center gap-xs">
          <button
            type="button"
            onClick={() => setActiveTab('statute')}
            className={`rounded-btn px-sm py-[4px] font-medium transition-colors ${
              activeTab === 'statute'
                ? 'bg-accent-soft/40 text-accent-text border border-accent/30'
                : 'text-muted hover:text-ink'
            }`}
          >
            ⚖️ Statutory Switcher (IPC ➔ BNS)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('draft')}
            className={`rounded-btn px-sm py-[4px] font-medium transition-colors ${
              activeTab === 'draft'
                ? 'bg-accent-soft/40 text-accent-text border border-accent/30'
                : 'text-muted hover:text-ink'
            }`}
          >
            📄 Clause & Draft Audit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('citator')}
            className={`rounded-btn px-sm py-[4px] font-medium transition-colors ${
              activeTab === 'citator'
                ? 'bg-accent-soft/40 text-accent-text border border-accent/30'
                : 'text-muted hover:text-ink'
            }`}
          >
            🏛️ Citator Signal Reader
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-md space-y-md">
        {activeTab === 'statute' && (
          <div className="space-y-md">
            {/* Search Filter */}
            <div className="relative">
              <SearchIcon className="absolute left-sm top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search IPC section, BNS section, or offense name..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full rounded-input border border-rule-2 bg-paper-2 py-xs pl-xl pr-md text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>

            {/* Mappings Table */}
            <div className="overflow-hidden rounded-card border border-rule-2 bg-paper-2">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-rule-2 bg-paper-3/50 font-semibold text-muted">
                  <tr>
                    <th className="px-md py-xs">Legacy IPC Code</th>
                    <th className="px-md py-xs">New BNS 2023 Code</th>
                    <th className="px-md py-xs">Offense Classification</th>
                    <th className="px-md py-xs">Key Amendment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule-2 font-mono">
                  {filteredMappings.map((row, idx) => (
                    <tr key={idx} className="hover:bg-paper-3/40 transition-colors">
                      <td className="px-md py-sm font-bold text-rose-300">{row.ipc}</td>
                      <td className="px-md py-sm font-bold text-emerald-400">{row.bns}</td>
                      <td className="px-md py-sm font-sans font-medium text-ink-2">{row.title}</td>
                      <td className="px-md py-sm font-sans text-muted text-[0.72rem]">{row.change}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'draft' && (
          <div className="space-y-md text-xs">
            <div className="rounded-card border border-amber-500/30 bg-amber-950/10 p-md space-y-xs">
              <div className="flex items-center justify-between font-semibold text-amber-300">
                <span>⚠️ High Risk Limitation Clause Identified</span>
                <span className="font-mono text-[0.7rem] bg-amber-500/20 px-2 py-[1px] rounded">Clause 14.2</span>
              </div>
              <p className="text-amber-200/80 leading-relaxed font-serif">
                "Neither party shall be liable for indirect damages exceeding INR 50,000, regardless of negligence or wilful breach."
              </p>
              <div className="flex items-center justify-between pt-xs border-t border-amber-500/20 text-[0.72rem] text-amber-300/90">
                <span>Suggested AI Amendment: Increase liability cap to match contract value.</span>
                <button type="button" className="font-bold underline hover:text-white">Apply Revision</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'citator' && (
          <div className="space-y-md text-xs">
            <div className="rounded-card border border-rule-2 bg-paper-2 p-md space-y-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">🟢 Supreme Court Precedent (2024 INSC 512)</span>
                <a href="https://indiankanoon.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-xs text-accent-text hover:underline">
                  Full Judgment <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </div>
              <p className="text-ink-2 font-serif leading-relaxed">
                The Supreme Court reiterated that circumstantial evidence must form an unbroken chain pointing solely to the guilt of the accused. High Court conviction under Section 302 set aside due to evidentiary gaps.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
