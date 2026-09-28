'use client'

import { useEffect, useState } from 'react'
import { identity, stats } from '@/lib/content'
import { brands } from '@/lib/portfolio-data'
import { useUi } from '@/lib/experience-store'
import { MODEL, PANEL_Y } from '@/lib/scene-config'
import { useActStage } from '@/lib/use-act-stage'
import { Annotation } from '../ui/Annotation'
import { DataPoint } from '../ui/DataPoint'
import { EditorialLabel } from '../ui/EditorialLabel'
import { TextReveal } from '../ui/TextReveal'

/**
 * What Act 01 says, and when. Very little text, each piece arriving with the
 * frame that makes it true: the line with the lit poster, the scale with the
 * reveal, the figure with the wide shot, the next act as the camera turns.
 */
const MARKS = [0.2, 0.34, 0.36, 0.66, 0.72]
const TAGS = ['Contenu', 'Influence', 'Social', 'Ads', 'IA']

const PANEL_CORNER: [number, number, number] = [-MODEL.panel.w / 2, PANEL_Y + MODEL.panel.h / 2, 0.2]
const FIGURE_HEAD: [number, number, number] = [1.8, MODEL.plinth.h + 3.45, 3.4]
const PROOFS: [number, number, number] = [-9, 10.6, -26]

export function SignalOverlay() {
  const entered = useUi((s) => s.entered)
  const stage = useActStage(0, MARKS)
  // the poster speaks alone while it fills the frame; the line follows the first step back
  const stepped = useActStage(0, [0.07])
  const [lit, setLit] = useState(false)

  // the line arrives once the lamps have caught
  useEffect(() => {
    if (!entered) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => setLit(true), reduce ? 0 : 2300)
    return () => clearTimeout(t)
  }, [entered])

  const campaigns = stats.find((s) => s.label === 'campagnes')
  const title = lit && stepped >= 1 && stage < 3
  return (
    <div className="signal" aria-live="off">
      <div className={`signal-title ${title ? 'is-shown' : ''} ${lit && stage < 3 ? 'is-lit' : ''}`}>
        <EditorialLabel index="01">Signal</EditorialLabel>
        <h1 className="sr-only">
          {identity.name}, {identity.role}
        </h1>
        <TextReveal className="signal-role" text={`${identity.name} — ${identity.role}`} show={title} />
        <TextReveal
          as="p"
          className="signal-line"
          text={`Des campagnes pour ${brands.length} marques, depuis ${identity.since}.`}
          show={title}
          delay={0.12}
        />
      </div>

      <div className={`signal-data ${stage >= 2 && stage < 5 ? 'is-shown' : ''}`}>
        {campaigns && <DataPoint value={campaigns.value} label={campaigns.label} show={stage >= 2 && stage < 5} />}
        <ul className="tags" aria-label="Métiers">
          {TAGS.map((t, i) => (
            <li key={t} style={{ transitionDelay: `${0.25 + i * 0.05}s` }}>
              {t}
            </li>
          ))}
        </ul>
      </div>

      <Annotation id="panel" point={PANEL_CORNER} index="A" show={stage >= 1 && stage < 4} side="left">
        Panneau 4 × 3 m, format d&apos;affichage
      </Annotation>
      <Annotation id="figure" point={FIGURE_HEAD} index="B" show={stage >= 1 && stage < 4}>
        Échelle 1:50 — 1,75 m = 3,5 cm
      </Annotation>
      <Annotation id="next" point={PROOFS} index="02" show={stage >= 5} side="left">
        Attention — contenus, campagnes, lancements
      </Annotation>
    </div>
  )
}
