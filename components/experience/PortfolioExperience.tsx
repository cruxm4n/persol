'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { useUi } from '@/lib/experience-store'
import { getProfile } from '@/lib/responsive-config'
import { useScrollDriver } from '@/lib/scroll'
import { ACTS } from '@/lib/scene-config'
import { ArchivePanel } from '../overlays/ArchivePanel'
import { SceneHUD } from '../overlays/SceneHUD'
import { SignalOverlay } from '../overlays/SignalOverlay'
import { Cursor } from '../ui/Cursor'
import { Loader } from '../ui/Loader'
import { EditorialLabel } from '../ui/EditorialLabel'
import { playIntro } from './intro'

const Stage = dynamic(() => import('./Stage'), { ssr: false })

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * The whole film. The page is only a scroll length split into acts; what is
 * seen is the fixed stage and the overlays that follow each act's progress.
 */
export default function PortfolioExperience() {
  const entered = useUi((s) => s.entered)
  const [free, setFree] = useState(false)
  const [env, setEnv] = useState<{ webgl: boolean; profile: ReturnType<typeof getProfile> } | null>(null)

  useEffect(() => {
    setEnv({ webgl: hasWebGL(), profile: getProfile() })
  }, [])

  // the page is held still while the lamps catch, then scrolling is free
  useEffect(() => {
    if (!entered) return
    playIntro(() => {})
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => setFree(true), reduce ? 0 : 2200)
    return () => clearTimeout(t)
  }, [entered])
  useScrollDriver(free)

  const lengths = useMemo(() => ACTS.map((a) => `${a.length * 100 + 100}vh`), [])

  return (
    <>
      <a className="skip" href="#attention">
        Aller à la suite
      </a>
      <div className="stage" aria-hidden="true">
        {env?.webgl && <Stage profile={env.profile} />}
        {env && !env.webgl && (
          // static frame of the model, rendered from the same scene
          // eslint-disable-next-line @next/next/no-img-element
          <img className="stage-fallback" src="fallback/signal.jpg" alt="" />
        )}
      </div>

      <SignalOverlay />
      <SceneHUD />

      <main className="acts">
        <section id="signal" data-act="0" className="act" style={{ height: lengths[0] }} aria-label="Acte 01, Signal" />
        <section id="attention" data-act="1" className="act act--pending" aria-labelledby="attention-title">
          <div className="pending">
            <EditorialLabel index="02">Attention</EditorialLabel>
            <h2 id="attention-title" className="pending-title">
              La scène suivante se construit après validation de celle-ci.
            </h2>
          </div>
        </section>
      </main>

      <ArchivePanel />
      <Cursor />
      <Loader />
    </>
  )
}
