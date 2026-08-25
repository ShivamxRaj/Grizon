import type { JSX } from 'react'
import { Spinner } from './Spinner'

interface SubmitButtonProps {
  label: string
  isLoading: boolean
}

export function SubmitButton({ label, isLoading }: SubmitButtonProps): JSX.Element {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="relative mt-md flex w-full items-center justify-center rounded-pill bg-accent-deep px-md py-[0.7rem] font-display text-sm font-semibold text-accent-ink shadow-sm transition-all duration-short ease-out hover:-translate-y-0.5 hover:bg-accent hover:shadow-md disabled:pointer-events-none disabled:opacity-70"
    >
      {isLoading ? <Spinner className="text-accent-ink" /> : label}
    </button>
  )
}
