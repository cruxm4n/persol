'use client'

import { brands } from '@/lib/portfolio-data'
import { setUi, useUi } from '@/lib/experience-store'
import { MagneticButton } from '../ui/MagneticButton'
import { ProgressIndicator } from './ProgressIndicator'

/** The frame around the film: name, archive, position, and a cue to scroll. */
export function SceneHUD() {
  const entered = useUi((s) => s.entered)
  const scrolled = useUi((s) => s.scrolled)
  return (
    <div className={`hud ${entered ? 'is-on' : ''}`}>
      <a className="hud-name" href="#signal" data-cursor="frame">
        Louis R.
      </a>
      <MagneticButton className="hud-archive" onClick={() => setUi({ archiveOpen: true })} label={`Archive, ${brands.length} marques`}>
        Archive <span className="hud-count">{brands.length}</span>
      </MagneticButton>
      <ProgressIndicator />
      <p className={`hud-cue ${scrolled ? 'is-hidden' : ''}`} aria-hidden="true">
        <span>Faire défiler</span>
        <span className="hud-cue-line" />
      </p>
    </div>
  )
}
