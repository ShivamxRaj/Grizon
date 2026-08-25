import type { JSX } from 'react'
import { TEXT_LINK_CLASSES } from '@/components/ui/buttonStyles'
import { ArrowRightIcon } from '@/components/ui/icons'
import { useAuthModal } from '@/features/auth/useAuthModal'
import { BentoCell } from './BentoCell'

export function LoginPromptCell({ index }: { index: number }): JSX.Element {
  const { openAuthModal } = useAuthModal()

  return (
    <BentoCell index={index} tone="quiet">
      <h2 className="text-lg text-ink">Already have an account?</h2>
      <button type="button" onClick={openAuthModal} className={TEXT_LINK_CLASSES}>
        Log in
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </BentoCell>
  )
}
