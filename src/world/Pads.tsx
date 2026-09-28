import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { COLORS, GLOW } from './palette'
import { FONT, glow, presence } from './util'
import { LANDING } from './anchors'

/** Circular survey marking: rings + tick crown, drawn flat on the ground. */
function PadMarkings({ radius = 9, ticks = 72 }: { radius?: number; ticks?: number }) {
  const geometry = useMemo(() => {
    const pts: number[] = []
    const ring = (r: number, seg = 160) => {
      for (let i = 0; i < seg; i++) {
        const a0 = (i / seg) * Math.PI * 2
        const a1 = ((i + 1) / seg) * Math.PI * 2
        pts.push(Math.cos(a0) * r, 0, Math.sin(a0) * r, Math.cos(a1) * r, 0, Math.sin(a1) * r)
      }
    }
    ring(radius)
    ring(radius * 0.62)
    ring(radius * 0.18, 48)
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2
      const len = i % 6 === 0 ? 1.1 : 0.45
      pts.push(Math.cos(a) * radius, 0, Math.sin(a) * radius, Math.cos(a) * (radius + len), 0, Math.sin(a) * (radius + len))
    }
    // crosshair
    const c = radius * 1.35
    pts.push(-c, 0, 0, -radius * 0.7, 0, 0, radius * 0.7, 0, 0, c, 0, 0)
    pts.push(0, 0, -c, 0, 0, -radius * 0.7, 0, 0, radius * 0.7, 0, 0, c)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [radius, ticks])

  return (
    <lineSegments geometry={geometry} position-y={0.03}>
      <lineBasicMaterial color={COLORS.bone} transparent opacity={0.55} />
    </lineSegments>
  )
}

function CornerLights({ radius = 11.5 }: { radius?: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const [on, off] = useMemo(() => [glow(COLORS.signal, GLOW), glow(COLORS.signal, GLOW * 0.12)], [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((m, i) => {
      if (!m) return
      const lit = Math.sin(t * 3.2 - i * 0.9) > 0.55
      ;(m.material as THREE.MeshBasicMaterial).color.copy(lit ? on : off)
    })
  })
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const a = Math.PI / 4 + (i * Math.PI) / 2
        return (
          <mesh key={i} ref={(m) => (refs.current[i] = m)} position={[Math.cos(a) * radius, 0.25, Math.sin(a) * radius]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshBasicMaterial toneMapped={false} />
          </mesh>
        )
      })}
    </>
  )
}

export function LaunchPad() {
  return (
    <group>
      <PadMarkings />
      <CornerLights />
      <Text
        font={FONT.serifItalic}
        fontSize={3.6}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0.2]}
        color={COLORS.bone}
        fillOpacity={0.8}
        anchorX="center"
        anchorY="middle"
      >
        LR
      </Text>
      <Text
        font={FONT.mono}
        fontSize={0.42}
        letterSpacing={0.2}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 7.3]}
        color={COLORS.bone}
        fillOpacity={0.6}
        anchorX="center"
      >
        MISSION · 2018 / AUJOURD'HUI
      </Text>
    </group>
  )
}

const beamVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float fade = pow(1.0 - vUv.y, 2.2);
    float pulse = 0.75 + 0.25 * sin(vUv.y * 40.0 - uTime * 6.0);
    gl_FragColor = vec4(uColor * pulse, fade * uOpacity);
  }
`

export function LandingBeacon() {
  const group = useRef<THREE.Group>(null)
  const sweep = useRef<THREE.Mesh>(null)
  const beam = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({ uColor: { value: glow(COLORS.signal, 2.2) }, uTime: { value: 0 }, uOpacity: { value: 0 } }),
    [],
  )
  useFrame(({ clock }) => {
    const k = presence(8, 1.6)
    uniforms.uTime.value = clock.elapsedTime
    uniforms.uOpacity.value = 0.25 + k * 0.55
    if (sweep.current) sweep.current.rotation.y = clock.elapsedTime * 0.8
  })
  return (
    <group ref={group} position={[LANDING.x, 0, LANDING.z]}>
      <PadMarkings radius={10} ticks={96} />
      <CornerLights radius={12.5} />
      <mesh position-y={30}>
        <cylinderGeometry args={[0.35, 0.35, 60, 24, 1, true]} />
        <shaderMaterial
          ref={beam}
          vertexShader={beamVertex}
          fragmentShader={beamFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={sweep} position-y={0.06} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.6, 10, 64, 1, 0, Math.PI / 5]} />
        <meshBasicMaterial color={glow(COLORS.signal, 1.2)} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
      </mesh>
      <Text
        font={FONT.mono}
        fontSize={0.5}
        letterSpacing={0.2}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.06, 8]}
        color={COLORS.bone}
        fillOpacity={0.65}
        anchorX="center"
      >
        ZONE D'ATTERRISSAGE · CONTACT
      </Text>
    </group>
  )
}
