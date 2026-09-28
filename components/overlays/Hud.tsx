'use client'

import { useUi } from '@/lib/experience-store'
import { ProgressIndicator } from './ProgressIndicator'

/** The frame around the walk: the name, where we are, a cue to scroll. Nothing to click. */
export function Hud() {
  const entered = useUi((s) => s.entered)
  const scrolled = useUi((s) => s.scrolled)
  return (
    <div className={`hud ${entered ? 'is-on' : ''}`} aria-hidden="true">
      <p className="hud-name">
        Louis R.<span>Île Signal</span>
      </p>
      <ProgressIndicator />
      <p className={`hud-cue ${scrolled ? 'is-hidden' : ''}`}>
        Faire défiler pour se promener
        <span className="hud-cue-line" />
      </p>
    </div>
  )
}
