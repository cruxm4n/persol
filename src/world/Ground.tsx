import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { COLORS } from './palette'
import { FONT } from './util'
import { GROUND_Y, curve, sideAt, yearAt, years } from './line'

const vertex = /* glsl */ `
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    vec4 mv = viewMatrix * w;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`
const fragment = /* glsl */ `
  uniform vec3 uPaper;
  uniform vec3 uGraphite;
  uniform float uNear;
  uniform float uFar;
  varying vec3 vWorld;
  varying float vDepth;
  float grid(vec2 p, float step, float width) {
    vec2 g = p / step;
    vec2 w = max(fwidth(g) * width, vec2(1e-4));
    vec2 f = abs(fract(g - 0.5) - 0.5);
    vec2 l = 1.0 - smoothstep(vec2(0.0), w, f);
    return max(l.x, l.y);
  }
  void main() {
    float minor = grid(vWorld.xz, 5.0, 1.0);
    float major = grid(vWorld.xz, 25.0, 1.2);
    float ink = minor * 0.07 + major * 0.16;
    float fog = smoothstep(uNear, uFar, vDepth);
    vec3 col = mix(uPaper, uGraphite, ink * (1.0 - fog));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

/** Graph paper under the line, with one graduation per calendar year. */
export function Ground() {
  const uniforms = useMemo(
    () => ({
      uPaper: { value: new THREE.Color(COLORS.paper) },
      uGraphite: { value: new THREE.Color(COLORS.graphite) },
      uNear: { value: 40 },
      uFar: { value: 230 },
    }),
    [],
  )

  const marks = useMemo(() => {
    const seg: THREE.Vector3[] = []
    const labels = years.map((y) => {
      const u = yearAt(y)
      const p = curve.getPointAt(Math.min(u, 1))
      const s = sideAt(u)
      const a = new THREE.Vector3(p.x, GROUND_Y + 0.03, p.z).addScaledVector(s, -9)
      const b = new THREE.Vector3(p.x, GROUND_Y + 0.03, p.z).addScaledVector(s, 9)
      seg.push(a, b)
      const angle = Math.atan2(s.x, s.z) - Math.PI / 2
      return { y, pos: b.clone().addScaledVector(s, 1), angle }
    })
    const geo = new THREE.BufferGeometry().setFromPoints(seg)
    return { geo, labels }
  }, [])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, GROUND_Y, -210]}>
        <planeGeometry args={[900, 900]} />
        <shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} />
      </mesh>
      <lineSegments geometry={marks.geo}>
        <lineBasicMaterial color={COLORS.graphite} transparent opacity={0.6} />
      </lineSegments>
      {marks.labels.map((l) => (
        <Text
          key={l.y}
          font={FONT.mono}
          fontSize={1.3}
          color={COLORS.graphite}
          position={l.pos}
          rotation={[-Math.PI / 2, 0, l.angle]}
          anchorX="left"
          anchorY="middle"
        >
          {String(l.y)}
        </Text>
      ))}
    </group>
  )
}
