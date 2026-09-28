import { lazy, Suspense, useMemo } from 'react'
import { Chapters } from './ui/Chapters'
import { Hud } from './ui/Hud'
import { useScrollDriver } from './scroll'
import { useUi } from './store'

const World = lazy(() => import('./world/World').then((m) => ({ default: m.World })))

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function Boot() {
  const ready = useUi((s) => s.ready)
  return (
    <div className={`boot ${ready ? 'is-done' : ''}`} aria-hidden="true">
      <div className="boot-inner">
        <span className="boot-ring" />
        <p>Calibrage des capteurs</p>
      </div>
    </div>
  )
}

export default function App() {
  useScrollDriver()
  const { webgl, lite } = useMemo(() => {
    const small = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches
    const weak = (navigator.hardwareConcurrency ?? 8) <= 4
    return { webgl: hasWebGL(), lite: small || weak }
  }, [])

  return (
    <>
      <a className="skip" href="#profil">
        Aller au contenu
      </a>
      {webgl ? (
        <>
          <Suspense fallback={null}>
            <World lite={lite} />
          </Suspense>
          <Boot />
        </>
      ) : (
        <div className="world world--fallback" aria-hidden="true" />
      )}
      <div className="scrim" aria-hidden="true" />
      <Hud />
      <Chapters />
    </>
  )
}
