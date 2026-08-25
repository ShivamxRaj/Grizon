import type { Components } from 'react-markdown'
import type { JSX, ReactNode } from 'react'
import { InlineArtifactImage } from './InlineArtifactImage'
import { artifactIdFromSrc, isArtifactSrc, type InlineArtifactMap } from './markdownUtils'

function CodeSpan({
  className,
  children,
  ...props
}: {
  className?: string
  children?: ReactNode
}): JSX.Element {
  const isBlock = Boolean(className?.includes('language-'))
  if (!isBlock) {
    return (
      <code className="rounded-sm bg-paper-3 px-3xs font-mono text-sm text-ink" {...props}>
        {children}
      </code>
    )
  }
  return (
    <code className={`${className ?? ''} font-mono text-sm text-ink`} {...props}>
      {children}
    </code>
  )
}

export function markdownComponents(inlineArtifacts?: InlineArtifactMap): Components {
  return {
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="text-accent-text underline decoration-rule underline-offset-2 hover:decoration-accent"
      >
        {children}
      </a>
    ),
    code: CodeSpan,
    pre: ({ children }) => (
      <pre className="my-sm overflow-x-auto rounded-card border border-rule bg-paper-2 p-sm text-sm leading-relaxed">
        {children}
      </pre>
    ),
    ul: ({ children }) => <ul className="my-sm list-disc space-y-2xs pl-md">{children}</ul>,
    ol: ({ children }) => <ol className="my-sm list-decimal space-y-2xs pl-md">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-sm border-l-2 border-rule pl-sm text-ink-2">{children}</blockquote>
    ),
    h1: ({ children }) => (
      <h1 className="mb-sm mt-md font-display text-xl font-semibold text-ink first:mt-0">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-xs mt-md font-display text-lg font-semibold text-ink first:mt-0">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-xs mt-sm font-display text-md font-semibold text-ink first:mt-0">{children}</h3>
    ),
    p: ({ children }) => <p className="my-[0.6em] first:mt-0 last:mb-0">{children}</p>,
    table: ({ children }) => (
      <div className="my-sm overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-rule bg-paper-2 px-xs py-2xs text-left font-semibold text-ink">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-rule px-xs py-2xs text-ink-2">{children}</td>
    ),
    hr: () => <hr className="my-md border-rule" />,
    img: ({ src, alt }) => {
      if (!isArtifactSrc(src)) {
        return (
          <img src={src} alt={alt ?? ''} className="my-sm max-w-full rounded-card border border-rule" />
        )
      }
      const id = artifactIdFromSrc(src)
      return (
        <InlineArtifactImage
          src={src}
          alt={alt}
          streamArtifact={inlineArtifacts?.[id]}
        />
      )
    },
  }
}
