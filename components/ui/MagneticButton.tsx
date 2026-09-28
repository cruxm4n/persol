'use client'

import { useRef, type ReactNode } from 'react'

/**
 * A button that leans a few pixels towards the pointer before it is clicked:
 * the only element on screen that answers the hand that way.
 */
export function MagneticButton({
  children,
  onClick,
  className = '',
  label,
}: {
  children: ReactNode
  onClick: () => void
  className?: string
  label?: string
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const move = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - (r.left + r.width / 2)) * 0.22
    const y = (e.clientY - (r.top + r.height / 2)) * 0.3
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
  }
  const leave = () => {
    if (ref.current) ref.current.style.transform = ''
  }
  return (
    <button
      ref={ref}
      type="button"
      className={`magnetic ${className}`}
      onClick={onClick}
      onPointerMove={move}
      onPointerLeave={leave}
      aria-label={label}
      data-cursor="frame"
    >
      {children}
    </button>
  )
}
