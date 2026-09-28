import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { projects } from '../content'
import { getUi, setUi } from '../store'
import { MISSION_VIEW, SCREENS } from './anchors'
import { COLORS } from './palette'
import { FONT, fadeTree, glow, presence } from './util'

const W = 5.8
const H = 3.4
const VIEW = new THREE.Vector3(...MISSION_VIEW.pos)

const screenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const screenFragment = /* glsl */ `
  uniform float uTime;
  uniform float uFocus;
  uniform float uSeed;
  uniform float uOpacity;
  uniform vec3 uSignal;
  varying vec2 vUv;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    vec2 uv = vUv;
    vec3 col = vec3(0.035, 0.04, 0.048);
    // scanlines + slow roll
    col += 0.018 * sin((uv.y + uTime * 0.03) * 420.0);
    // live "campaign signal" waveform across the lower third
    float x = uv.x * 12.0 + uSeed * 7.0;
    float wave = 0.2 + 0.07 * sin(x + uTime * 1.3) + 0.04 * sin(x * 2.7 - uTime * 2.1) + 0.03 * sin(x * 6.1 + uSeed);
    wave += uv.x * 0.08 * (0.4 + uFocus);
    float line = 1.0 - smoothstep(0.0, 0.006, abs(uv.y - wave));
    float fill = step(uv.y, wave) * 0.07;
    col += uSignal * (line * (0.35 + uFocus * 1.8) + fill * (0.4 + uFocus));
    // measurement ticks
    float tick = step(0.985, fract(uv.x * 24.0)) * step(uv.y, 0.06);
    col += vec3(0.25) * tick;
    // border
    vec2 b = min(uv, 1.0 - uv);
    float edge = 1.0 - smoothstep(0.0, 0.006, min(b.x * ${(H / W).toFixed(3)}, b.y));
    col += mix(vec3(0.3), uSignal * 2.2, uFocus) * edge;
    gl_FragColor = vec4(col, uOpacity);
  }
`

function Screen({ i }: { i: number }) {
  const s = SCREENS[i]
  const p = projects[i]
  const mat = useRef<THREE.ShaderMaterial>(null)
  const focus = useRef(0)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFocus: { value: 0 },
      uSeed: { value: i * 1.7 },
      uOpacity: { value: 1 },
      uSignal: { value: glow(COLORS.signal, 1.6) },
    }),
    [i],
  )
  const rotY = useMemo(() => Math.atan2(VIEW.x - s.x, VIEW.z - s.z), [s])

  useFrame(({ clock }, delta) => {
    const f = getUi().focusProject
    const target = f === null ? 0.25 : f === i ? 1 : 0.05
    focus.current = THREE.MathUtils.damp(focus.current, target, 4, delta)
    uniforms.uTime.value = clock.elapsedTime
    uniforms.uFocus.value = focus.current
    uniforms.uOpacity.value = presence(3, 1.4)
  })

  return (
    <group position={[s.x, s.y, s.z]} rotation-y={rotY}>
      {/* legs */}
      {[-W / 2 + 0.6, W / 2 - 0.6].map((x) => (
        <mesh key={x} position={[x, (s.g - s.y) / 2 - 0.5, -0.1]}>
          <boxGeometry args={[0.07, s.y - s.g + 1, 0.07]} />
          <meshBasicMaterial color={COLORS.steel} />
        </mesh>
      ))}
      <mesh
        position-y={H / 2}
        onClick={(e) => {
          e.stopPropagation()
          setUi({ focusProject: getUi().focusProject === i ? null : i })
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <planeGeometry args={[W, H]} />
        <shaderMaterial ref={mat} vertexShader={screenVertex} fragmentShader={screenFragment} uniforms={uniforms} transparent toneMapped={false} />
      </mesh>
      <group position={[-W / 2 + 0.35, H - 0.35, 0.02]}>
        <Text font={FONT.mono} fontSize={0.17} letterSpacing={0.14} color={COLORS.contour} anchorX="left" anchorY="top">
          {`DOSSIER ${p.id} · ${p.role.toUpperCase()}`}
        </Text>
        <Text font={FONT.serif} fontSize={1.2} color={COLORS.bone} position={[0, -0.36, 0]} anchorX="left" anchorY="top">
          {p.id}
        </Text>
        <Text font={FONT.sans} fontSize={0.4} color={COLORS.bone} position={[0, -1.6, 0]} anchorX="left" anchorY="top" maxWidth={W - 0.7}>
          {p.title}
        </Text>
      </group>
    </group>
  )
}

export function MissionScreens() {
  const root = useRef<THREE.Group>(null)
  useFrame(() => {
    if (root.current) fadeTree(root.current, presence(3, 1.4))
  })
  return (
    <group ref={root}>
      {projects.slice(0, SCREENS.length).map((p, i) => (
        <Screen key={p.id} i={i} />
      ))}
    </group>
  )
}
