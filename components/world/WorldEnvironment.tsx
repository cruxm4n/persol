'use client'

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { experience } from '@/lib/experience-store'
import { islandShape, pathCurve, rng } from '@/lib/island'
import { surfaceMaterial, toon, wind } from '@/lib/materials'
import type { Profile } from '@/lib/responsive-config'
import { GROUND, PALETTE } from '@/lib/scene-config'
import { Forest } from '../objects/StylizedTree'
import { day } from './WorldLighting'

// ---------- sky ----------

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const skyFragment = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSun;
  uniform vec3 uSunDir;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 col = mix(uHorizon, uZenith, smoothstep(-0.02, 0.6, h));
    // a warm band just above the horizon, strongest towards the sun
    float s = max(dot(d, normalize(uSunDir)), 0.0);
    col = mix(col, uSun, (1.0 - smoothstep(0.0, 0.25, abs(h))) * 0.25 * (0.4 + 0.6 * s));
    col += uSun * (pow(s, 900.0) * 1.4 + pow(s, 12.0) * 0.18);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

/** A painted gradient dome that follows the camera, so its horizon never moves. */
function Sky() {
  const ref = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        uniforms: {
          uZenith: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() },
          uSun: { value: new THREE.Color() },
          uSunDir: { value: new THREE.Vector3() },
        },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  )
  useFrame(() => {
    mat.uniforms.uZenith.value.copy(day.zenith)
    mat.uniforms.uHorizon.value.copy(day.horizon)
    mat.uniforms.uSun.value.copy(day.sun)
    mat.uniforms.uSunDir.value.copy(day.sunDir)
    ref.current?.position.copy(camera.position)
  })
  return (
    <mesh ref={ref} material={mat} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[300, 32, 16]} />
    </mesh>
  )
}

// ---------- sea ----------

const seaVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`
const seaFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uShallow;
  uniform vec3 uDeep;
  uniform vec3 uFoam;
  uniform vec3 uSky;
  uniform vec3 uFog;
  uniform vec3 uSunDir;
  uniform vec3 uSun;
  varying vec3 vWorld;

  // same outline as lib/island.ts
  float shore(float t) {
    float c = cos(t), s = sin(t);
    float e = 1.0 / sqrt(c * c / 324.0 + s * s / 961.0);
    return e * (1.0 + 0.055 * sin(3.0 * t + 1.2) + 0.035 * sin(5.0 * t + 2.1) + 0.02 * sin(9.0 * t));
  }

  void main() {
    vec2 p = vWorld.xz;
    float th = atan(p.y, p.x);
    float k = length(p) / shore(th);

    vec3 col = mix(uShallow, uDeep, smoothstep(1.14, 2.3, k));
    // soft ripples, a little lighter where they crest
    float rip = sin(p.x * 0.55 + uTime * 0.9 + sin(p.y * 0.3)) * sin(p.y * 0.47 - uTime * 0.7);
    col += smoothstep(0.55, 1.0, rip) * 0.05;

    // foam: a band on the sand line, and a ring that rolls in and fades
    float lap = 0.012 * sin(uTime * 1.3 + th * 5.0);
    float band = 1.0 - smoothstep(0.0, 0.028, abs(k - (1.155 + lap)));
    float roll = fract(uTime * 0.09);
    float ring = (1.0 - smoothstep(0.0, 0.02, abs(k - (1.34 - roll * 0.17)))) * roll * 0.55;
    col = mix(col, uFoam, clamp(band * 0.85 + ring, 0.0, 1.0));

    // sky reflected at grazing angles, the sun's glitter on the water
    vec3 v = normalize(cameraPosition - vWorld);
    float fres = pow(1.0 - max(v.y, 0.0), 4.0);
    col = mix(col, uSky, fres * 0.6);
    vec3 r = reflect(-v, vec3(0.0, 1.0, 0.0));
    col += uSun * pow(max(dot(r, normalize(uSunDir)), 0.0), 220.0) * 0.6;

    // fade into the fog colour far away
    float dist = length(cameraPosition - vWorld);
    col = mix(col, uFog, smoothstep(130.0, 320.0, dist));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

const SHALLOW = [new THREE.Color('#9fd8cb'), new THREE.Color('#e3b99d')]
const DEEP = [new THREE.Color('#5f9ea3'), new THREE.Color('#566d93')]

function Sea() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: seaVertex,
        fragmentShader: seaFragment,
        uniforms: {
          uTime: wind.uTime,
          uShallow: { value: new THREE.Color() },
          uDeep: { value: new THREE.Color() },
          uFoam: { value: new THREE.Color('#fbf7ee') },
          uSky: { value: new THREE.Color() },
          uFog: { value: new THREE.Color() },
          uSunDir: { value: new THREE.Vector3() },
          uSun: { value: new THREE.Color() },
        },
      }),
    [],
  )
  useFrame(() => {
    const u = mat.uniforms
    u.uShallow.value.lerpColors(SHALLOW[0], SHALLOW[1], day.t * 0.55)
    u.uDeep.value.lerpColors(DEEP[0], DEEP[1], day.t)
    u.uSky.value.copy(day.horizon)
    u.uFog.value.copy(day.fog)
    u.uSunDir.value.copy(day.sunDir)
    u.uSun.value.copy(day.sun)
  })
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={GROUND.water} material={mat}>
      <circleGeometry args={[330, 96]} />
    </mesh>
  )
}

// ---------- island ----------

function Island() {
  const { sand, grass } = useMemo(() => {
    const sand = new THREE.ExtrudeGeometry(islandShape(1.14), {
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.25,
      bevelSize: 0.5,
      bevelSegments: 3,
      curveSegments: 4,
    })
    const grass = new THREE.ExtrudeGeometry(islandShape(1), {
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.35,
      bevelSize: 0.55,
      bevelSegments: 4,
      curveSegments: 4,
    })
    return { sand, grass }
  }, [])
  return (
    <group>
      <mesh geometry={sand} rotation-x={-Math.PI / 2} position-y={GROUND.sand - 0.45} material={surfaceMaterial('sand', PALETTE.sand)} receiveShadow />
      <mesh geometry={grass} rotation-x={-Math.PI / 2} position-y={GROUND.grass - 0.65} material={surfaceMaterial('grass', PALETTE.grass)} receiveShadow />
    </group>
  )
}

/** The sandy path: a ribbon laid on the grass, its UVs in metres like the island's. */
function Path() {
  const geometry = useMemo(() => {
    const n = 360
    const pos: number[] = []
    const uv: number[] = []
    const idx: number[] = []
    const p = new THREE.Vector3()
    const t = new THREE.Vector3()
    const r = rng(5)
    for (let i = 0; i <= n; i++) {
      const u = i / n
      pathCurve.getPointAt(u, p)
      pathCurve.getTangentAt(u, t)
      const w = 0.95 + Math.sin(u * 40) * 0.08 + (r() - 0.5) * 0.06
      const sx = -t.z * w
      const sz = t.x * w
      for (const side of [-1, 1]) {
        const x = p.x + sx * side
        const z = p.z + sz * side
        pos.push(x, GROUND.grass + 0.025, z)
        uv.push(x, -z)
      }
      if (i < n) {
        const a = i * 2
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [])
  return <mesh geometry={geometry} material={surfaceMaterial('sand', PALETTE.path)} receiveShadow />
}

// ---------- sky life ----------

/** Low-poly clouds drifting slowly round the island. */
function Clouds({ count }: { count: number }) {
  const ref = useRef<THREE.Group>(null)
  const clouds = useMemo(() => {
    const r = rng(9)
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + r() * 0.6
      const d = 34 + r() * 40
      return {
        position: [Math.cos(a) * d, 26 + r() * 14, Math.sin(a) * d - 6] as [number, number, number],
        puffs: Array.from({ length: 4 + Math.floor(r() * 3) }, (_, j) => ({
          p: [(j - 2) * 1.9 + r(), r() * 1.1, (r() - 0.5) * 2] as [number, number, number],
          s: 1.6 + r() * 1.6,
        })),
      }
    })
  }, [count])
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 2), [])
  useFrame((_, dt) => {
    if (ref.current && !experience.reducedMotion) ref.current.rotation.y += dt * 0.006
  })
  return (
    <group ref={ref}>
      {clouds.map((c, i) => (
        <group key={i} position={c.position}>
          {c.puffs.map((p, j) => (
            <mesh key={j} geometry={geo} position={p.p} scale={[p.s * 1.3, p.s, p.s]} material={toon(PALETTE.cloud)} />
          ))}
        </group>
      ))}
    </group>
  )
}

/** A few birds circling the lighthouse point. */
function Birds() {
  const birds = useRef<(THREE.Group | null)[]>([])
  const wings = useMemo(
    () =>
      [1, -1].map((side) => {
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.18, 0, 0, 0.18, 0.75 * side, 0, 0.05], 3))
        return g
      }),
    [],
  )
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fbf7ee', side: THREE.DoubleSide }), [])
  const conf = useMemo(() => [0, 1, 2, 3].map((i) => ({ r: 7 + i * 1.6, h: 11 + (i % 2) * 2.5, speed: 0.22 + i * 0.03, phase: i * 1.7 })), [])
  useFrame(({ clock }) => {
    const t = experience.reducedMotion ? 0 : clock.elapsedTime
    birds.current.forEach((b, i) => {
      if (!b) return
      const c = conf[i]
      const a = t * c.speed + c.phase
      b.position.set(11.5 + Math.cos(a) * c.r, c.h + Math.sin(a * 2) * 0.4, 19.5 + Math.sin(a) * c.r)
      b.rotation.y = -a
      const flap = Math.sin(t * 7 + c.phase) * 0.55
      b.children[0].rotation.z = flap
      b.children[1].rotation.z = -flap
    })
  })
  return (
    <>
      {conf.map((_, i) => (
        <group key={i} ref={(el) => void (birds.current[i] = el)} scale={0.9}>
          <mesh geometry={wings[0]} material={mat} />
          <mesh geometry={wings[1]} material={mat} />
        </group>
      ))}
    </>
  )
}

export function WorldEnvironment({ profile }: { profile: Profile }) {
  return (
    <group>
      <Sky />
      <Sea />
      <Island />
      <Path />
      <Forest profile={profile} />
      <Clouds count={profile.mobile ? 5 : 9} />
      <Birds />
    </group>
  )
}
