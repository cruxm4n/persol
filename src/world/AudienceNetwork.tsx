import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { profile } from '../content'
import { NETWORK, NETWORK_EYE, ground } from './anchors'
import { COLORS, GLOW } from './palette'
import { FONT, dotTexture, fadeTree, glow, presence } from './util'

const PER_CLUSTER = 28

function rand(seed: number) {
  const s = Math.sin(seed * 91.345) * 47453.5453
  return s - Math.floor(s)
}

/**
 * Profile scene: one strategic core, five disciplines, and the audiences
 * they reach on the ground. Signals travel core → discipline → audience.
 */
export function AudienceNetwork() {
  const root = useRef<THREE.Group>(null)
  const core = useRef<THREE.Group>(null)
  const pulses = useRef<THREE.Points>(null)

  const data = useMemo(() => {
    const centre = new THREE.Vector3(NETWORK.x, NETWORK.y, NETWORK.z)
    const n = profile.pillars.length
    // lay the disciplines out on an ellipse facing the viewer so every label reads
    const view = new THREE.Vector3().subVectors(centre, new THREE.Vector3(...NETWORK_EYE)).setY(0).normalize()
    const right = new THREE.Vector3().crossVectors(view, new THREE.Vector3(0, 1, 0)).normalize()
    const pillars = profile.pillars.map((p, i) => {
      const a = Math.PI / 2 + (i / n) * Math.PI * 2
      const pos = centre
        .clone()
        .addScaledVector(right, Math.cos(a) * 8)
        .addScaledVector(view, Math.sin(a * 2) * 2.5)
        .setY(centre.y + Math.sin(a) * 5)
      return { ...p, pos, a }
    })

    const audience: THREE.Vector3[] = []
    const links: [THREE.Vector3, THREE.Vector3][] = []
    pillars.forEach((p, i) => {
      const cx = centre.x + right.x * Math.cos(p.a) * 18 + view.x * (Math.sin(p.a) * 10 + 6)
      const cz = centre.z + right.z * Math.cos(p.a) * 18 + view.z * (Math.sin(p.a) * 10 + 6)
      for (let k = 0; k < PER_CLUSTER; k++) {
        const r = Math.sqrt(rand(i * 100 + k)) * 6.5
        const th = rand(i * 100 + k + 0.5) * Math.PI * 2
        const x = cx + Math.cos(th) * r
        const z = cz + Math.sin(th) * r
        const v = new THREE.Vector3(x, ground(x, z) + 0.35, z)
        audience.push(v)
        links.push([p.pos, v])
      }
    })

    const spokes = new THREE.BufferGeometry().setFromPoints(pillars.flatMap((p) => [centre, p.pos]))
    const reach = new THREE.BufferGeometry().setFromPoints(links.flat())
    const crowd = new THREE.BufferGeometry().setFromPoints(audience)
    const pulseGeo = new THREE.BufferGeometry()
    pulseGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((links.length + n) * 3), 3))

    return { centre, pillars, links, spokes, reach, crowd, pulseGeo }
  }, [])

  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (root.current) fadeTree(root.current, presence(1, 1.35))
    if (core.current) {
      core.current.rotation.y = t * 0.35
      core.current.rotation.x = Math.sin(t * 0.4) * 0.3
    }
    const attr = pulses.current?.geometry.attributes.position as THREE.BufferAttribute | undefined
    if (!attr) return
    let idx = 0
    data.pillars.forEach((p, i) => {
      const f = (t * 0.45 + i * 0.2) % 1
      tmp.lerpVectors(data.centre, p.pos, f)
      attr.setXYZ(idx++, tmp.x, tmp.y, tmp.z)
    })
    data.links.forEach(([a, b], i) => {
      const f = (t * 0.28 + rand(i) * 1.0) % 1
      tmp.lerpVectors(a, b, f)
      attr.setXYZ(idx++, tmp.x, tmp.y, tmp.z)
    })
    attr.needsUpdate = true
  })

  return (
    <group ref={root}>
      <group ref={core} position={data.centre}>
        <mesh>
          <octahedronGeometry args={[1.5, 0]} />
          <meshBasicMaterial color={COLORS.bone} wireframe transparent opacity={0.7} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.45, 20, 20]} />
          <meshBasicMaterial color={glow(COLORS.signal, GLOW)} toneMapped={false} />
        </mesh>
      </group>
      <Billboard position={[data.centre.x, data.centre.y - 2.6, data.centre.z]}>
        <Text font={FONT.mono} fontSize={0.34} letterSpacing={0.18} color={COLORS.bone} fillOpacity={0.7} anchorX="center">
          STRATÉGIE
        </Text>
      </Billboard>

      <lineSegments geometry={data.spokes}>
        <lineBasicMaterial color={COLORS.bone} transparent opacity={0.6} />
      </lineSegments>
      <lineSegments geometry={data.reach}>
        <lineBasicMaterial color={COLORS.contour} transparent opacity={0.12} />
      </lineSegments>
      <points geometry={data.crowd}>
        <pointsMaterial map={dotTexture()} color={COLORS.bone} size={0.45} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
      </points>
      <points ref={pulses} geometry={data.pulseGeo} frustumCulled={false}>
        <pointsMaterial map={dotTexture()} color={glow(COLORS.signal, GLOW)} size={0.5} sizeAttenuation transparent opacity={1} depthWrite={false} toneMapped={false} />
      </points>

      {data.pillars.map((p) => (
        <group key={p.id} position={p.pos}>
          <mesh>
            <sphereGeometry args={[0.28, 16, 16]} />
            <meshBasicMaterial color={glow(COLORS.bone, 1.6)} toneMapped={false} transparent />
          </mesh>
          <mesh rotation-x={Math.PI / 2}>
            <ringGeometry args={[0.55, 0.62, 40]} />
            <meshBasicMaterial color={COLORS.bone} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          <Billboard position={[0, 1.1, 0]}>
            <Text font={FONT.sans} fontSize={0.8} color={COLORS.bone} anchorX="center" anchorY="bottom">
              {p.label}
            </Text>
            <Text
              font={FONT.mono}
              fontSize={0.26}
              letterSpacing={0.08}
              color={COLORS.contour}
              position={[0, -0.12, 0]}
              anchorX="center"
              anchorY="top"
            >
              {p.note.toUpperCase()}
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  )
}
