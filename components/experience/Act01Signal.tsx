'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { experience } from '@/lib/experience-store'
import { COLORS, MODEL, PANEL_Y } from '@/lib/scene-config'
import type { Profile } from '@/lib/responsive-config'
import { MATERIALS, SHEET, labelTexture, loadImage, posterTexture, sheetTexture, tableTexture } from '@/lib/textures'
import { lights } from './intro'

/**
 * Act 01 — Signal.
 * A 4 × 3 billboard at 1:50 on a foam-board plinth, on a drafting sheet, in a
 * dark room. It opens as a full-frame poster; scrolling steps back until the
 * poster turns out to be a model, then rounds it towards Act 02.
 */

const { plinth, panel, post } = MODEL
const TOP = plinth.h
const PANEL_BOTTOM = PANEL_Y - panel.h / 2
const PANEL_TOP = PANEL_Y + panel.h / 2
const LAMP_X = [-2.7, 0, 2.7]
const LAMP_HEAD = (x: number) => new THREE.Vector3(x, PANEL_TOP + 0.55, 1.45)

function useMaterials() {
  return useMemo(
    () => ({
      foam: new THREE.MeshStandardMaterial({ color: COLORS.foam, roughness: 0.92 }),
      core: new THREE.MeshStandardMaterial({ color: COLORS.core, roughness: 1 }),
      metal: new THREE.MeshStandardMaterial({ color: COLORS.metal, roughness: 0.48, metalness: 0.35 }),
      figure: new THREE.MeshStandardMaterial({ color: '#a8a39a', roughness: 0.85 }),
      lampHead: new THREE.MeshStandardMaterial({ color: '#2a2926', roughness: 0.4, metalness: 0.5 }),
    }),
    [],
  )
}

type Mats = ReturnType<typeof useMaterials>

function Box({
  size,
  position,
  material,
  rotation,
}: {
  size: [number, number, number]
  position: [number, number, number]
  material: THREE.Material
  rotation?: [number, number, number]
}) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  )
}

/** Foam board: two paper faces around a foam core, visible on the cut edge. */
function Plinth({ mats }: { mats: Mats }) {
  const skin = 0.06
  return (
    <group>
      <Box size={[plinth.w, skin, plinth.d]} position={[0, skin / 2, 0]} material={mats.foam} />
      <Box size={[plinth.w - 0.02, plinth.h - skin * 2, plinth.d - 0.02]} position={[0, plinth.h / 2, 0]} material={mats.core} />
      <Box size={[plinth.w, skin, plinth.d]} position={[0, plinth.h - skin / 2, 0]} material={mats.foam} />
    </group>
  )
}

function Billboard({ mats, poster, fake }: { mats: Mats; poster: THREE.Texture; fake: boolean }) {
  const b = panel.border
  const posterMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: poster,
        roughness: 0.82,
        emissive: new THREE.Color('#ffffff'),
        emissiveMap: poster,
        emissiveIntensity: 0,
      }),
    [poster],
  )
  useEffect(() => () => posterMat.dispose(), [posterMat])

  // the poster also glows faintly with the lamps: on mobile, where there are
  // no spotlights, that is all the lamps do
  useFrame(() => {
    const lit = (lights.lamps[0] + lights.lamps[1] + lights.lamps[2]) / 3
    posterMat.emissiveIntensity = lit * (fake ? 0.55 : 0.06)
  })

  const deckY = PANEL_BOTTOM - 0.28
  return (
    <group>
      {/* single post, base plate, access ladder */}
      <Box size={[1.3, 0.08, 1.3]} position={[0, TOP + 0.04, 0]} material={mats.metal} />
      <Box size={[post.w, post.h + 0.2, post.w]} position={[0, TOP + post.h / 2, -0.25]} material={mats.metal} />
      {[-0.38, 0.38].map((x) => (
        <Box key={x} size={[0.04, post.h - 0.4, 0.04]} position={[x, TOP + post.h / 2 - 0.1, 0.12]} material={mats.metal} />
      ))}
      {Array.from({ length: 11 }, (_, i) => (
        <Box key={i} size={[0.76, 0.03, 0.03]} position={[0, TOP + 0.4 + i * 0.38, 0.12]} material={mats.metal} />
      ))}

      {/* frame and poster */}
      <Box size={[panel.w + b * 2, panel.h + b * 2, panel.depth]} position={[0, PANEL_Y, -0.12]} material={mats.metal} />
      <mesh position={[0, PANEL_Y, panel.depth / 2 - 0.1]} material={posterMat} receiveShadow>
        <planeGeometry args={[panel.w, panel.h]} />
      </mesh>

      {/* bracing behind */}
      {[-2.6, 2.6].map((x) => (
        <Box key={x} size={[0.1, 0.1, 5.2]} position={[x, PANEL_Y - 0.6, -0.4]} rotation={[0.9, 0, 0]} material={mats.metal} />
      ))}
      <Box size={[panel.w - 0.6, 0.12, 0.12]} position={[0, PANEL_Y, -0.45]} material={mats.metal} />

      {/* catwalk with its rail */}
      <Box size={[panel.w, 0.05, 0.75]} position={[0, deckY, 0.45]} material={mats.metal} />
      <Box size={[panel.w, 0.04, 0.04]} position={[0, deckY + 0.55, 0.8]} material={mats.metal} />
      {Array.from({ length: 9 }, (_, i) => (
        <Box key={i} size={[0.035, 0.55, 0.035]} position={[-panel.w / 2 + i * (panel.w / 8), deckY + 0.28, 0.8]} material={mats.metal} />
      ))}

      {/* three lamp arms over the poster */}
      {LAMP_X.map((x) => {
        const head = LAMP_HEAD(x)
        return (
          <group key={x}>
            <Box size={[0.05, 0.05, 1.4]} position={[x, PANEL_TOP + 0.35, 0.7]} rotation={[-0.15, 0, 0]} material={mats.metal} />
            <mesh position={head} rotation={[-2.2, 0, 0]} material={mats.lampHead} castShadow>
              <cylinderGeometry args={[0.16, 0.26, 0.4, 20, 1, true]} />
            </mesh>
          </group>
        )
      })}

      {/* the mast and its red light: the signal */}
      <Box size={[0.05, 1.3, 0.05]} position={[panel.w / 2 - 0.3, PANEL_TOP + 0.75, -0.2]} material={mats.metal} />
    </group>
  )
}

/** A 1:50 figure, as architects put in models: it gives the scale at a glance. */
function Figure({ mats, position, rotation = 0 }: { mats: Mats; position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      {[-0.13, 0.13].map((x) => (
        <mesh key={x} position={[x, 0.8, 0]} material={mats.figure} castShadow>
          <capsuleGeometry args={[0.11, 1.35, 4, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 2.25, 0]} material={mats.figure} castShadow>
        <capsuleGeometry args={[0.3, 0.8, 4, 12]} />
      </mesh>
      <mesh position={[0, 3.18, 0]} material={mats.figure} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
      </mesh>
    </group>
  )
}

/** Act 02, waiting in the dark: blank proofs of the posters to come. */
const PROOFS: { w: number; h: number; x: number; z: number; r: number; y?: number }[] = [
  { w: 7, h: 9.5, x: -9, z: -26, r: 0.25 },
  { w: 4, h: 5.5, x: -2.5, z: -31, r: -0.1, y: 2 },
  { w: 11, h: 7, x: 4, z: -38, r: -0.3 },
  { w: 3, h: 4.2, x: -15, z: -34, r: 0.5 },
  { w: 5.5, h: 7.5, x: -18, z: -21, r: 0.7, y: 1 },
  { w: 3.6, h: 2.7, x: 1, z: -24, r: -0.5 },
]

function Proofs({ mats }: { mats: Mats }) {
  return (
    <group>
      {PROOFS.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]} rotation-y={p.r}>
          <Box size={[p.w, p.h, 0.3]} position={[0, (p.y ?? 0) + p.h / 2 + 0.6, 0]} material={mats.foam} />
          <Box size={[p.w * 0.6, 0.6, 1.6]} position={[0, 0.3, 0]} material={mats.core} />
        </group>
      ))}
    </group>
  )
}

export function Act01Signal({ profile }: { profile: Profile }) {
  const mats = useMaterials()
  const [photos, setPhotos] = useState<{ oak: HTMLImageElement | null; paper: HTMLImageElement | null }>({ oak: null, paper: null })
  useEffect(() => {
    Promise.all([loadImage(MATERIALS.oak), loadImage(MATERIALS.paper)]).then(([oak, paper]) => setPhotos({ oak, paper }))
  }, [])
  const tex = useMemo(() => ({ poster: posterTexture(), label: labelTexture() }), [])
  const sheet = useMemo(() => sheetTexture(photos.paper), [photos.paper])
  const table = useMemo(() => tableTexture(photos.oak), [photos.oak])
  const key = useRef<THREE.SpotLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const spots = useRef<(THREE.SpotLight | null)[]>([])
  const bulbs = useMemo(() => LAMP_X.map(() => new THREE.MeshBasicMaterial({ color: COLORS.lamp })), [])
  const beacon = useMemo(() => new THREE.MeshBasicMaterial({ color: COLORS.red }), [])
  const beaconOff = useMemo(() => new THREE.Color('#3a1512'), [])
  const beaconOn = useMemo(() => new THREE.Color(COLORS.red), [])
  const lampOff = useMemo(() => new THREE.Color('#2b2a27'), [])
  const lampOn = useMemo(() => new THREE.Color(COLORS.lamp), [])
  const posterFake = !profile.spotLights
  // spotlight targets must live in the scene to be placed
  const targets = useMemo(
    () =>
      LAMP_X.map((x) => {
        const o = new THREE.Object3D()
        o.position.set(x, PANEL_Y - 1.2, 0.2)
        return o
      }),
    [],
  )

  useFrame(({ clock }) => {
    if (key.current) key.current.intensity = 5200 * lights.key
    if (hemi.current) hemi.current.intensity = 0.05 + 0.35 * lights.ambient
    spots.current.forEach((s, i) => s && (s.intensity = 16 * lights.lamps[i]))
    bulbs.forEach((m, i) => m.color.lerpColors(lampOff, lampOn, lights.lamps[i]))
    // a slow beacon: on for a breath, then low, like an aviation light
    const t = clock.elapsedTime % 2.6
    const pulse = experience.reducedMotion ? 1 : t < 0.9 ? Math.sin((t / 0.9) * Math.PI) : 0
    beacon.color.lerpColors(beaconOff, beaconOn, lights.beacon * (0.25 + 0.75 * pulse))
  })

  return (
    <group>
      {/* the room: a dark table, and the drafting sheet in the pool of light */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.03, -20]} receiveShadow>
        <planeGeometry args={[700, 700]} />
        <meshStandardMaterial map={table} color="#8c8378" roughness={0.62} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[SHEET.cx, 0, SHEET.cz]} receiveShadow>
        <planeGeometry args={[SHEET.w, SHEET.d]} />
        <meshStandardMaterial map={sheet} roughness={0.95} />
      </mesh>

      <Plinth mats={mats} />
      <mesh rotation={[-Math.PI / 2, 0, 0.05]} position={[-plinth.w / 2 + 4.4, TOP + 0.012, plinth.d / 2 - 2.6]} receiveShadow>
        <planeGeometry args={[5.4, 2.7]} />
        <meshStandardMaterial map={tex.label} roughness={0.9} />
      </mesh>
      <Billboard mats={mats} poster={tex.poster} fake={posterFake} />
      <Figure mats={mats} position={[1.8, TOP, 3.4]} rotation={Math.PI + 0.4} />
      <Figure mats={mats} position={[-6.2, TOP, 5.6]} rotation={Math.PI - 0.7} />
      <Proofs mats={mats} />

      {/* lamp bulbs and beacon: they are the light sources, so they are drawn unlit */}
      {LAMP_X.map((x, i) => {
        const h = LAMP_HEAD(x)
        return (
          <mesh key={x} position={[h.x, h.y - 0.13, h.z - 0.1]} rotation={[-2.2, 0, 0]} material={bulbs[i]}>
            <circleGeometry args={[0.2, 20]} />
          </mesh>
        )
      })}
      <mesh position={[panel.w / 2 - 0.3, PANEL_TOP + 1.45, -0.2]} material={beacon}>
        <sphereGeometry args={[0.13, 16, 16]} />
      </mesh>

      {/* lights: one key over the table, three lamps on the poster, a faint fill */}
      <hemisphereLight ref={hemi} args={['#fff3e4', '#2b2622', 0.05]} />
      <spotLight
        ref={key}
        position={[-16, 44, 30]}
        angle={0.42}
        penumbra={0.95}
        decay={2}
        distance={0}
        color="#ffe7cc"
        castShadow
        shadow-mapSize={[profile.shadowMapSize, profile.shadowMapSize]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.03}
        shadow-camera-near={20}
        shadow-camera-far={120}
      />
      {targets.map((t, i) => (
        <primitive key={i} object={t} />
      ))}
      {profile.spotLights &&
        LAMP_X.map((x, i) => {
          const h = LAMP_HEAD(x)
          return (
            <spotLight
              key={x}
              ref={(el) => void (spots.current[i] = el)}
              position={h}
              angle={0.95}
              penumbra={0.8}
              decay={2}
              distance={10}
              color={COLORS.lamp}
              target={targets[i]}
            />
          )
        })}
    </group>
  )
}
