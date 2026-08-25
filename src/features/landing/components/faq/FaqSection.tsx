import type { JSX, ReactNode } from 'react'
import { ChevronDownIcon } from '@/components/ui/icons'
import { TEXT_LINK_CLASSES } from '@/components/ui/buttonStyles'
import { PageWrap } from '@/components/layout/PageWrap'
import { CONTACT_EMAIL, STATIC_PRIVACY_URL } from '@/constants/routes'

interface FaqEntry {
  question: string
  answer: ReactNode
}

const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: 'What does Auto actually do?',
    answer:
      "It reads your question and routes it to whichever agent fits best — a generalist for most things, the Trading Analyst for markets, the Coding Expert for debugging. You can always override it and pick an agent yourself.",
  },
  {
    question: 'Can I switch agents mid-conversation?',
    answer: "Yes. The thread keeps its context — switching agents doesn't start you over, it just changes who's answering.",
  },
  {
    question: 'Is my data used to train models?',
    answer: (
      <>
        No. Your conversations stay yours — they aren't used to train models for anyone else. See our{' '}
        <a href={STATIC_PRIVACY_URL} className={TEXT_LINK_CLASSES}>
          Privacy Policy
        </a>{' '}
        for the full details.
      </>
    ),
  },
  {
    question: 'What happens to my threads, projects, and Drive files?',
    answer:
      'They stay attached to your account and stay in sync across devices — Free keeps 7 days of history, Plus and Pro keep everything.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: "Yes — no lock-in. Cancel from your account settings and you'll keep access until the end of your billing period.",
  },
  {
    question: 'Do you offer plans for teams?',
    answer: (
      <>
        Pro includes shared team threads. If you need seats beyond that,{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className={TEXT_LINK_CLASSES}>
          get in touch
        </a>{' '}
        and we'll set it up.
      </>
    ),
  },
]

function FaqItem({ question, answer }: FaqEntry): JSX.Element {
  return (
    <details className="group border-b border-rule">
      <summary className="flex list-none items-center justify-between gap-md py-md font-display text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {question}
        <ChevronDownIcon className="h-4.5 w-4.5 flex-none text-muted transition-transform duration-short ease-out group-open:rotate-180" />
      </summary>
      <p className="max-w-[60ch] pb-md text-sm text-ink-2">{answer}</p>
    </details>
  )
}

export function FaqSection(): JSX.Element {
  return (
    <section id="faq" className="relative z-[1] border-t border-rule py-2xl pb-3xl">
      <PageWrap>
        <div className="mb-xl max-w-[52ch]">
          <h2 className="text-2xl tracking-[-0.03em] text-ink">Frequently asked</h2>
          <p className="mt-xs text-md text-muted">The short, honest version.</p>
        </div>
        <div className="flex max-w-[68ch] flex-col">
          {FAQ_ENTRIES.map((entry) => (
            <FaqItem key={entry.question} {...entry} />
          ))}
        </div>
      </PageWrap>
    </section>
  )
}
