import { lazy, Suspense, useMemo } from 'react'
import { Chapters } from './ui/Chapters'
import { Masthead } from './ui/Masthead'
import { BrandIndex } from './ui/BrandIndex'
import { useScrollDriver } from './scroll'
import { useUi } from './store'

const LineFallback = lazy(() => import('./ui/LineFallback').then((m) => ({ default: m.LineFallback })))
const World = lazy(() => import('./world/World').then((m) => ({ default: m.World })))

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function App() {
  useScrollDriver()
  const ready = useUi((s) => s.ready)
  const inStop = useUi((s) => s.inStop)
  const active = useUi((s) => s.active)
  const { webgl, lite } = useMemo(() => {
    const small = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches
    return { webgl: hasWebGL(), lite: small }
  }, [])

  return (
    <>
      <a className="skip" href="#marques">
        Aller au contenu
      </a>
      {webgl ? (
        <div className={`stage ${ready ? 'is-ready' : ''} ${inStop ? 'is-under-text' : ''} ${active > 0 ? 'is-reading' : ''} ${active === 1 ? 'is-quiet' : ''}`}>
          <Suspense fallback={null}>
            <World lite={lite} />
          </Suspense>
        </div>
      ) : (
        <Suspense fallback={null}>
          <LineFallback />
        </Suspense>
      )}
      <Masthead />
      <Chapters />
      <BrandIndex />
    </>
  )
}
