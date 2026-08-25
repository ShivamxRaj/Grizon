import type { JSX, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface PageWrapProps {
  children: ReactNode
  className?: string
}

export function PageWrap({ children, className }: PageWrapProps): JSX.Element {
  return (
    <div className={cn('mx-auto max-w-[1180px]', className)} style={{ paddingInline: 'var(--page-gutter)' }}>
      {children}
    </div>
  )
}
