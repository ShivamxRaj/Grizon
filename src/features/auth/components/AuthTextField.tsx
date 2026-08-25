import type { JSX, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface AuthTextFieldProps {
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  name?: string
  autoComplete?: string
  autoFocus?: boolean
  trailing?: ReactNode
}

export function AuthTextField({
  label,
  type,
  value,
  onChange,
  error,
  placeholder,
  name,
  autoComplete,
  autoFocus,
  trailing,
}: AuthTextFieldProps): JSX.Element {
  const hasError = Boolean(error)

  return (
    <label className={cn('mt-sm flex flex-col gap-1.5', hasError && 'auth-field-error')}>
      <span className="text-xs font-semibold text-ink-2">{label}</span>
      <span className="relative flex">
        <input
          type={type}
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required
          className={cn(
            'w-full min-w-0 rounded-input border bg-paper px-[0.9rem] py-3 text-base text-ink outline-none transition-colors duration-short ease-out placeholder:text-muted',
            Boolean(trailing) && 'pr-[2.6rem]',
            hasError ? 'border-danger' : 'border-rule hover:border-accent/35 focus-visible:border-accent',
          )}
        />
        {trailing}
      </span>
      {hasError && (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  )
}
