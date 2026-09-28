import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { SHOW_GAPS, stops } from '../../lib/portfolio-data'
import { flight } from '../../store'
import { COLORS } from '../palette'
import { FONT } from '../util'
import { GROUND_Y, STOP_U, curve } from '../line'
import { attention } from './layout'

/**
 * Stop 01 — Brand Attention.
 * Panels hung beside the line like an exhibition wall: one large for the main
 * project, smaller ones for the others. Each is hung (unfolds from its base)
 * as the camera reaches it. Images are shown as archives, in two inks; until
 * they are provided, the panel is hatched and says so.
 */

const STOP = 0

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform vec3 uPaper;
  uniform vec3 uInk;
  uniform vec3 uGraphite;
  uniform float uAspect;
  uniform float uHasMap;
  uniform sampler2D uMap;
  varying vec2 vUv;
  void main() {
    vec3 col;
    if (uHasMap > 0.5) {
      // archive treatment: two inks, lifted blacks, a coarse halftone
      float l = dot(texture2D(uMap, vUv).rgb, vec3(0.299, 0.587, 0.114));
      vec2 cell = fract(vUv * vec2(uAspect, 1.0) * 90.0) - 0.5;
      float dotR = sqrt(1.0 - l) * 0.62;
      float ink = 1.0 - smoothstep(dotR - 0.08, dotR + 0.08, length(cell));
      col = mix(uPaper, uInk, ink * 0.92);
    } else {
      // placeholder: diagonal hatching, like an empty frame on a plan
      float d = (vUv.x * uAspect + vUv.y) * 22.0;
      float w = fwidth(d);
      float line = 1.0 - smoothstep(0.0, max(w, 1e-4) * 1.4, abs(fract(d) - 0.5) - 0.06);
      col = mix(uPaper, uGraphite, line * 0.32);
    }
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

function ArchivePanel({ index }: { index: number }) {
  const spot = attention.panels[index]
  const project = stops[STOP].projects[index]
  const hang = useRef<THREE.Group>(null)
  const { width: w, height: h } = spot

  const material = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uPaper: { value: new THREE.Color(COLORS.paper) },
        uInk: { value: new THREE.Color(COLORS.ink) },
        uGraphite: { value: new THREE.Color(COLORS.graphite) },
        uAspect: { value: w / h },
        uHasMap: { value: 0 },
        uMap: { value: null as THREE.Texture | null },
      },
    })
    if (project.image) {
      new THREE.TextureLoader().load(project.image, (t) => {
        m.uniforms.uMap.value = t
        m.uniforms.uHasMap.value = 1
      })
    }
    return m
  }, [project.image, w, h])

  const frame = useMemo(() => {
    const pts = [
      [-w / 2, 0],
      [w / 2, 0],
      [w / 2, h],
      [-w / 2, h],
      [-w / 2, 0],
    ].map(([x, y]) => new THREE.Vector3(x, y, 0.01))
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: COLORS.ink }))
  }, [w, h])

  // stakes from the panel's base down to the ground
  const stakes = useMemo(() => {
    const drop = spot.centre.y - h / 2 - GROUND_Y
    const pts = [-w / 2 + 0.4, w / 2 - 0.4].flatMap((x) => [new THREE.Vector3(x, 0, -0.02), new THREE.Vector3(x, -drop, -0.02)])
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [spot, w, h])

  useFrame(() => {
    if (!hang.current) return
    // hung just before the camera arrives on it
    const mark = flight.marks[STOP][index] ?? 0.3 + index * 0.2
    const p = flight.stopsSmooth[STOP]
    const t = THREE.MathUtils.clamp((p - (mark - 0.22)) / 0.12, 0, 1)
    const e = 1 - Math.pow(1 - t, 3)
    hang.current.scale.y = Math.max(0.001, e)
    hang.current.visible = e > 0.001
  })

  return (
    <group position={[spot.centre.x, spot.centre.y - h / 2, spot.centre.z]} rotation-y={attention.rotationY}>
      <lineSegments geometry={stakes}>
        <lineBasicMaterial color={COLORS.graphite} transparent opacity={0.5} />
      </lineSegments>
      <group ref={hang}>
        <mesh position={[0, h / 2, 0]} material={material}>
          <planeGeometry args={[w, h]} />
        </mesh>
        <primitive object={frame} />
        {!project.image && SHOW_GAPS && (
          <Text font={FONT.mono} fontSize={index === 0 ? 0.32 : 0.24} color={COLORS.graphite} position={[0, h / 2, 0.02]} anchorX="center" anchorY="middle">
            Visuel à fournir
          </Text>
        )}
      </group>
      {/* caption, printed on the wall under the panel */}
      <Text font={FONT.mono} fontSize={0.26} color={COLORS.ink} position={[-w / 2, -0.35, 0.01]} anchorX="left" anchorY="top">
        {`Fig. ${project.number}`}
      </Text>
      <Text
        font={FONT.sans}
        fontSize={index === 0 ? 0.42 : 0.32}
        color={COLORS.ink}
        position={[-w / 2, -0.78, 0.01]}
        anchorX="left"
        anchorY="top"
        maxWidth={w}
      >
        {project.title}
      </Text>
    </group>
  )
}

/** Exit: the last caption rule runs on, along the line, to Stop 02. */
function ExitRule() {
  const line = useMemo(() => {
    const last = attention.panels[attention.panels.length - 1]
    const start = last.centre
      .clone()
      .addScaledVector(attention.along, last.width / 2)
      .setY(last.centre.y - last.height / 2 - 0.35)
    const end = curve.getPointAt(STOP_U[1])
    const mid = start.clone().lerp(end, 0.5)
    mid.y = Math.min(start.y, end.y) - 1.5
    const pts = new THREE.QuadraticBezierCurve3(start, mid, end).getPoints(120)
    const l = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: COLORS.graphite, transparent: true, opacity: 0.7 }),
    )
    l.frustumCulled = false
    return l
  }, [])

  useFrame(() => {
    const t = THREE.MathUtils.smoothstep(flight.stopsSmooth[STOP], 0.8, 1)
    line.geometry.setDrawRange(0, Math.floor(121 * t))
  })

  return <primitive object={line} />
}

export function AttentionScene() {
  return (
    <group>
      {attention.panels.map((_, i) => (
        <ArchivePanel key={i} index={i} />
      ))}
      <ExitRule />
    </group>
  )
}
