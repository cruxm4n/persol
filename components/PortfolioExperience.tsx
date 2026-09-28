'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { assetPath } from '@/lib/asset-manifest'
import { experience, useUi } from '@/lib/experience-store'
import { loadFonts } from '@/lib/materials'
import { getProfile, type Profile } from '@/lib/responsive-config'
import { ROUTE_LENGTH } from '@/lib/scene-config'
import { useScrollDriver } from '@/lib/scroll'
import { Chapters } from './overlays/Chapters'
import { Hud } from './overlays/Hud'
import { Loader } from './ui/Loader'

const PortfolioWorld = dynamic(() => import('./world/PortfolioWorld'), { ssr: false })

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * The whole walk: the island fixed behind, the chapters scrolling over it.
 * Each chapter is as long as its place's share of the route, so the camera
 * reaches a place as its chapter comes into view. Without WebGL the island
 * becomes a still picture and the chapters read as a plain page.
 */
export default function PortfolioExperience() {
  const entered = useUi((s) => s.entered)
  const [free, setFree] = useState(false)
  const [env, setEnv] = useState<{ webgl: boolean; profile: Profile } | null>(null)

  // the island's signs are painted with the site's fonts: wait for them first
  useEffect(() => {
    const webgl = hasWebGL()
    if (!webgl) document.documentElement.classList.add('no-webgl')
    loadFonts().finally(() => setEnv({ webgl, profile: getProfile() }))
  }, [])

  // the camera settles onto the island, then the walk is free
  useEffect(() => {
    if (!entered) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) experience.intro = 1
    else gsap.to(experience, { intro: 1, duration: 2.8, ease: 'expo.out' })
    const t = setTimeout(() => setFree(true), reduce ? 0 : 1400)
    return () => clearTimeout(t)
  }, [entered])
  useScrollDriver(free)

  const webgl = env?.webgl !== false
  const length = env?.profile.mobile ? ROUTE_LENGTH.mobile : ROUTE_LENGTH.desktop

  return (
    <>
      <div className="world" aria-hidden="true">
        {env?.webgl && <PortfolioWorld profile={env.profile} />}
        {env && !env.webgl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="world-still" src={assetPath('concept')} alt="" />
        )}
      </div>
      <Chapters length={length} />
      <Hud />
      {webgl && <Loader />}
    </>
  )
}
