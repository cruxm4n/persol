'use client'

import { useEffect, useRef } from 'react'
import { registerAnchor } from '@/lib/anchors'

/**
 * A callout pinned to a point of the model, drawn like an architect's
 * annotation: a dot on the object, a leader, a short label.
 */
export function Annotation({
  id,
  point,
  index,
  children,
  show,
  side = 'right',
}: {
  id: string
  point: [number, number, number]
  index: string
  children: React.ReactNode
  show: boolean
  side?: 'left' | 'right'
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    return registerAnchor(id, ref.current, point)
  }, [id, point])
  return (
    <div ref={ref} className={`annotation annotation--${side} ${show ? 'is-shown' : ''}`} aria-hidden={!show}>
      <span className="annotation-dot" />
      <span className="annotation-leader" />
      <span className="annotation-body">
        <span className="annotation-index">{index}</span>
        <span className="annotation-text">{children}</span>
      </span>
    </div>
  )
}
