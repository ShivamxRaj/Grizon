import { useState, type JSX } from 'react'
import { cn } from '@/lib/utils/cn'
import { AGENT_OPTIONS, DEFAULT_AGENT_ID } from '@/features/chat/data/agents'
import { DEMO_ACCOUNT } from '@/features/chat/data/account'
import { SettingsGroup, SettingRow } from '../components/primitives/SettingsGroup'
import { SegmentedControl } from '../components/primitives/SegmentedControl'
import { SelectField, SettingsTextArea, SettingsTextField } from '../components/primitives/Fields'
import { ToggleRow } from '../components/primitives/Toggle'
import { useToggleSet } from '../hooks/useToggleSet'
import {
  RESPONSE_STYLES,
  STYLE_TRAITS,
  DEFAULT_INSTRUCTIONS,
  OCCUPATION_OPTIONS,
  AGENT_IDS_BY_PLAN,
} from '../data/personalization'

const PRECEDENCE_NOTE = 'These instructions → project instructions → this chat. The more specific one wins.'

function AboutYouGroup(): JSX.Element {
  const [nickname, setNickname] = useState('Maulik')
  const [role, setRole] = useState('designer')

  return (
    <SettingsGroup label="About you">
      <SettingRow label="What should we call you?">
        <SettingsTextField label="Nickname" value={nickname} onChange={setNickname} placeholder="Your name" />
      </SettingRow>
      <SettingRow label="What do you do?" description="Optional. Helps Grizon pitch answers at the right level.">
        <SelectField label="Occupation" value={role} options={OCCUPATION_OPTIONS} onChange={setRole} />
      </SettingRow>
    </SettingsGroup>
  )
}

function InstructionsGroup(): JSX.Element {
  const [instructions, setInstructions] = useState(DEFAULT_INSTRUCTIONS)

  return (
    <SettingsGroup label="Instructions for Grizon">
      <SettingsTextArea
        label="Instructions for Grizon"
        value={instructions}
        onSave={setInstructions}
        rows={5}
        placeholder="How should Grizon approach your questions?"
        footnote={PRECEDENCE_NOTE}
      />
    </SettingsGroup>
  )
}

function TraitChips({ active, onToggle }: { active: string[]; onToggle: (trait: string) => void }): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2xs py-xs">
      {STYLE_TRAITS.map((trait) => (
        <button
          key={trait}
          type="button"
          aria-pressed={active.includes(trait)}
          onClick={() => onToggle(trait)}
          className={cn(
            'rounded-pill border px-2xs py-[0.2rem] text-xs font-medium transition-colors duration-short ease-out active:scale-95',
            active.includes(trait) ? 'border-accent bg-accent-soft text-accent-text' : 'border-rule text-muted hover:border-accent hover:text-ink',
          )}
        >
          {trait}
        </button>
      ))}
    </div>
  )
}

function StyleGroup(): JSX.Element {
  const [style, setStyle] = useState('default')
  const [traits, setTraits] = useState<string[]>(['Skip the preamble'])

  const toggleTrait = (trait: string): void => {
    setTraits((current) => (current.includes(trait) ? current.filter((item) => item !== trait) : [...current, trait]))
  }
  const sample = RESPONSE_STYLES.find((option) => option.value === style)?.sample ?? ''

  return (
    <SettingsGroup label="Response style">
      <SettingRow label="Style" stacked>
        <SegmentedControl label="Response style" options={RESPONSE_STYLES} value={style} onChange={setStyle} wrap />
      </SettingRow>
      <SettingRow label="Traits" description="Layered on top of the style." stacked>
        <TraitChips active={traits} onToggle={toggleTrait} />
      </SettingRow>
      <div className="py-xs">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted">Preview</p>
        <p className="settings-wrap mt-3xs text-sm text-ink-2">“{sample}”</p>
      </div>
    </SettingsGroup>
  )
}

/** Only agents the current plan entitles — nothing is listed that can't be run. */
const INCLUDED_AGENTS = AGENT_OPTIONS.filter((agent) =>
  (AGENT_IDS_BY_PLAN[DEMO_ACCOUNT.planId] ?? []).includes(agent.id),
)

function AgentsGroup(): JSX.Element {
  const [defaultAgent, setDefaultAgent] = useState(DEFAULT_AGENT_ID)
  const { values, set } = useToggleSet(Object.fromEntries(INCLUDED_AGENTS.map((agent) => [agent.id, true])))
  const agentOptions = INCLUDED_AGENTS.map((agent) => ({ value: agent.id, label: agent.name }))

  return (
    <SettingsGroup label={`Agents · included in ${DEMO_ACCOUNT.planName}`}>
      <SettingRow label="Default agent" description={INCLUDED_AGENTS.find((a) => a.id === defaultAgent)?.description}>
        <SelectField label="Default agent" value={defaultAgent} options={agentOptions} onChange={setDefaultAgent} />
      </SettingRow>
      {INCLUDED_AGENTS.map((agent) => (
        <ToggleRow key={agent.id} label={agent.name} description={agent.description} checked={values[agent.id]} onChange={(next) => set(agent.id, next)} />
      ))}
    </SettingsGroup>
  )
}

export function PersonalizationSection(): JSX.Element {
  return (
    <>
      <AboutYouGroup />
      <InstructionsGroup />
      <StyleGroup />
      <AgentsGroup />
    </>
  )
}
