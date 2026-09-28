'use client'

import { useEffect, useState } from 'react'
import { experience } from './experience-store'

/**
 * How many of `marks` the act's on-screen progress has passed. Re-renders
 * only when that count changes, so overlays can follow the camera exactly
 * without re-rendering every frame.
 */
export function useActStage(act: number, marks: number[]) {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    let raf = 0
    let last = -1
    const tick = () => {
      const p = experience.actsSmooth[act]
      let n = 0
      for (const m of marks) if (p >= m) n++
      if (n !== last) {
        last = n
        setStage(n)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // marks are static per overlay
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [act])
  return stage
}
