import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { brandSectors, brands } from '../content'
import { getUi, setUi } from '../store'
import { DISTRICT, ground } from './anchors'
import { COLORS, GLOW } from './palette'
import { FONT, fadeTree, glow } from './util'

const STEP = 6.4
const SECTOR_GAP = 7

type Station = {
  name: string
  sector: string
  sectorLabel: string
  index: number
  side: 1
  x: number
  z: number
  towerH: number
  g: number
}

function layout(): { stations: Station[]; sectorMarks: { label: string; z: number; count: number }[] } {
  const stations: Station[] = []
  const sectorMarks: { label: string; z: number; count: number }[] = []
  let z = DISTRICT.zStart
  let n = 0
  brandSectors.forEach((sector, si) => {
    const list = brands.filter((b) => b.sector === sector.id)
    if (si > 0) z -= SECTOR_GAP
    sectorMarks.push({ label: sector.label, z: z + 3.5, count: list.length })
    list.forEach((b) => {
      const side = 1 as const
      const x = n % 2 === 0 ? 13 : 17
      stations.push({
        name: b.name,
        sector: b.sector,
        sectorLabel: sector.label,
        index: n + 1,
        side,
        x,
        z,
        towerH: 13 + ((n * 7.3) % 11),
        g: ground(x, z),
      })
      z -= STEP
      n++
    })
  })
  return { stations, sectorMarks }
}

const dim = glow(COLORS.signal, 0.35)
const lit = glow(COLORS.signal, GLOW)

function StationMesh({ s }: { s: Station }) {
  const plate = useRef<THREE.Group>(null)
  const edge = useRef<THREE.LineBasicMaterial>(null)
  const beacon = useRef<THREE.MeshBasicMaterial>(null)
  const name = useRef<THREE.Mesh & { fillOpacity: number }>(null)
  const state = useRef({ glow: 0 })

  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(2.4, s.towerH, 2.4)), [s.towerH])
  const frame = useMemo(() => {
    const w = 5.6
    const h = 2.3
    const pts = [
      [-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2],
      [w / 2, h / 2], [-w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2],
    ].map(([x, y]) => new THREE.Vector3(x, y, 0.01))
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [])

  const plateX = s.side * 8.4
  const plateY = 8.2

  useFrame(({ camera }, delta) => {
    const dz = camera.position.z - s.z
    // "Station validated" once the drone reaches it; hover forces it on.
    const passing = THREE.MathUtils.clamp(1 - Math.abs(dz - 14) / 16, 0, 1)
    const hovered = getUi().hoverBrand === s.name ? 1 : 0
    const target = Math.max(passing, hovered)
    state.current.glow = THREE.MathUtils.damp(state.current.glow, target, 5, delta)
    const k = state.current.glow
    edge.current?.color.lerpColors(dim, lit, k)
    beacon.current?.color.lerpColors(dim, lit, 0.2 + k * 0.8)
    if (plate.current) {
      plate.current.position.y = s.g + plateY + Math.sin(performance.now() * 0.001 + s.index) * 0.06
      // clear the windscreen: signs dissolve just before the drone reaches them
      const f = THREE.MathUtils.clamp((dz - 4) / 7, 0, 1)
      fadeTree(plate.current, f)
      if (name.current) name.current.fillOpacity = (0.55 + k * 0.45) * f
    }
  })

  return (
    <group>
      {/* tower */}
      <group position={[s.x, s.g + s.towerH / 2, s.z - 1.6]}>
        <mesh>
          <boxGeometry args={[2.4, s.towerH, 2.4]} />
          <meshBasicMaterial color={COLORS.night} />
        </mesh>
        <lineSegments geometry={edges}>
          <lineBasicMaterial color={COLORS.steel} />
        </lineSegments>
        <mesh position-y={s.towerH / 2 + 0.25}>
          <boxGeometry args={[0.3, 0.5, 0.3]} />
          <meshBasicMaterial ref={beacon} toneMapped={false} />
        </mesh>
      </group>
      {/* arm */}
      <mesh position={[(plateX + s.x) / 2, s.g + plateY + 1.15, s.z - 0.8]}>
        <boxGeometry args={[s.x - plateX, 0.06, 0.06]} />
        <meshBasicMaterial color={COLORS.steel} />
      </mesh>
      {/* sign plate, facing the approaching drone */}
      <group
        ref={plate}
        position={[plateX, s.g + plateY, s.z]}
        onPointerOver={(e) => {
          e.stopPropagation()
          setUi({ hoverBrand: s.name })
          document.body.style.cursor = 'crosshair'
        }}
        onPointerOut={() => {
          setUi({ hoverBrand: null })
          document.body.style.cursor = ''
        }}
      >
        <mesh>
          <planeGeometry args={[5.6, 2.3]} />
          <meshBasicMaterial color="#0d0f12" transparent opacity={0.92} />
        </mesh>
        <lineSegments geometry={frame}>
          <lineBasicMaterial ref={edge} toneMapped={false} />
        </lineSegments>
        <Text
          font={FONT.mono}
          fontSize={0.2}
          letterSpacing={0.14}
          color={COLORS.contour}
          position={[-2.55, 0.85, 0.02]}
          anchorX="left"
          anchorY="top"
        >
          {`${String(s.index).padStart(2, '0')} / ${s.sectorLabel.toUpperCase()}`}
        </Text>
        <Text
          ref={name}
          font={FONT.sans}
          fontSize={0.78}
          letterSpacing={-0.01}
          color={COLORS.bone}
          position={[-2.55, -0.28, 0.02]}
          anchorX="left"
          anchorY="middle"
          maxWidth={5.1}
        >
          {s.name}
        </Text>
      </group>
    </group>
  )
}

/** Unlabelled blocks on the far side of the valley: skyline, not content. */
function Skyline() {
  const blocks = useMemo(() => {
    const out: { x: number; z: number; h: number; w: number; g: number }[] = []
    for (let i = 0; i < 22; i++) {
      const z = DISTRICT.zStart - i * 4.8 - ((i * 13) % 5)
      const x = -12 - ((i * 7.7) % 10)
      const h = 6 + ((i * 5.3) % 16)
      out.push({ x, z, h, w: 1.6 + ((i * 3.1) % 2), g: ground(x, z) })
    }
    return out
  }, [])
  const edges = useMemo(() => blocks.map((b) => new THREE.EdgesGeometry(new THREE.BoxGeometry(b.w, b.h, b.w))), [blocks])
  return (
    <group>
      {blocks.map((b, i) => (
        <group key={i} position={[b.x, b.g + b.h / 2, b.z]}>
          <mesh>
            <boxGeometry args={[b.w, b.h, b.w]} />
            <meshBasicMaterial color={COLORS.night} />
          </mesh>
          <lineSegments geometry={edges[i]}>
            <lineBasicMaterial color={COLORS.steel} transparent opacity={0.5} />
          </lineSegments>
        </group>
      ))}
    </group>
  )
}

export function BrandDistrict() {
  const { stations, sectorMarks } = useMemo(layout, [])
  return (
    <group>
      <Skyline />
      {stations.map((s) => (
        <StationMesh key={s.name} s={s} />
      ))}
      {sectorMarks.map((m) => (
        <group key={m.label} position={[0, ground(0, m.z) + 0.08, m.z]} rotation-x={-Math.PI / 2}>
          <Text font={FONT.mono} fontSize={0.9} letterSpacing={0.24} color={COLORS.signal} fillOpacity={0.9} anchorX="center">
            {m.label.toUpperCase()}
          </Text>
          <mesh position={[0, -0.95, 0]}>
            <planeGeometry args={[16, 0.05]} />
            <meshBasicMaterial color={COLORS.signal} transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
