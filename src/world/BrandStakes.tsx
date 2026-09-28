import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { getUi } from '../store'
import { COLORS } from './palette'
import { FONT } from './util'
import { GROUND_Y, brandStakes, curve } from './line'

const ink = new THREE.Color(COLORS.ink)
const graphite = new THREE.Color(COLORS.graphite)

type Label = THREE.Mesh & { color: number | string }

/**
 * One surveyor's stake per brand, set beside the line and tied to it.
 * The stake the reader is on (index row in view, or hovered) is inked.
 */
export function BrandStakes() {
  const lines = useRef<THREE.LineSegments>(null)
  const labels = useRef<(Label | null)[]>([])
  const weights = useRef(brandStakes.map(() => 0))

  const geo = useMemo(() => {
    const pts: number[] = []
    const cols: number[] = []
    for (const s of brandStakes) {
      const onLine = curve.getPointAt(s.u)
      // vertical stake
      pts.push(s.base.x, GROUND_Y, s.base.z, s.base.x, s.top, s.base.z)
      // tie back to the line
      pts.push(s.base.x, onLine.y, s.base.z, onLine.x, onLine.y, onLine.z)
      for (let k = 0; k < 4; k++) cols.push(graphite.r, graphite.g, graphite.b)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    return g
  }, [])

  const tmp = useMemo(() => new THREE.Color(), [])

  useFrame((_, delta) => {
    const { hoverBrand, currentBrand } = getUi()
    const col = geo.attributes.color as THREE.BufferAttribute
    brandStakes.forEach((s, i) => {
      const on = hoverBrand === s.name || (hoverBrand === null && currentBrand === i) ? 1 : 0
      const w = (weights.current[i] = THREE.MathUtils.damp(weights.current[i], on, 8, delta))
      tmp.lerpColors(graphite, ink, w)
      for (let k = 0; k < 4; k++) col.setXYZ(i * 4 + k, tmp.r, tmp.g, tmp.b)
      const l = labels.current[i]
      if (l) {
        l.color = tmp.getHex()
        l.scale.setScalar(1 + w * 0.15)
      }
    })
    col.needsUpdate = true
  })

  return (
    <group>
      <lineSegments ref={lines} geometry={geo}>
        <lineBasicMaterial vertexColors />
      </lineSegments>
      {brandStakes.map((s, i) => (
        <Billboard key={s.name} position={[s.base.x, s.top + 0.35, s.base.z]} lockX lockZ>
          <Text
            ref={(t) => {
              labels.current[i] = t as unknown as Label
            }}
            color={COLORS.graphite}
            font={FONT.sans}
            fontSize={0.7}
            anchorX="center"
            anchorY="bottom"
          >
            {s.name}
          </Text>
        </Billboard>
      ))}
    </group>
  )
}
