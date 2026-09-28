'use client'

import { Fragment, type CSSProperties } from 'react'

/**
 * Words rise out of a mask, one after the other. The text is always in the
 * DOM (read by assistive tech and search engines); only its paint moves.
 */
export function TextReveal({
  text,
  show,
  as: Tag = 'span',
  className = '',
  delay = 0,
  stagger = 0.045,
}: {
  text: string
  show: boolean
  as?: 'span' | 'p' | 'h1' | 'h2' | 'div'
  className?: string
  delay?: number
  stagger?: number
}) {
  const words = text.split(' ')
  return (
    <Tag className={`reveal ${show ? 'is-shown' : ''} ${className}`} aria-label={text}>
      {words.map((w, i) => (
        // the space sits between the masks: inside an inline-block it would be trimmed
        <Fragment key={i}>
          <span className="reveal-mask" aria-hidden="true">
            <span className="reveal-word" style={{ '--d': `${delay + i * stagger}s` } as CSSProperties}>
              {w}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  )
}
