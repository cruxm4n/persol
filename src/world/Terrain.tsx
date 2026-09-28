import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TERRAIN, heightAt } from './terrain'
import { COLORS, FOG_DENSITY } from './palette'

const vertex = /* glsl */ `
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

const fragment = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uLine;
  uniform vec3 uAccent;
  uniform vec3 uFog;
  uniform float uFogDensity;
  uniform vec3 uCam;
  uniform float uScanZ;
  varying vec3 vWorld;
  varying float vDepth;

  float lineAA(float v, float width) {
    float f = abs(fract(v - 0.5) - 0.5);
    float w = max(fwidth(v) * width, 1e-4);
    return 1.0 - smoothstep(0.0, w, f);
  }

  void main() {
    float h = vWorld.y;
    float minor = lineAA((h + 0.61) / 1.5, 1.0);
    float major = lineAA((h + 3.37) / 7.5, 1.5);
    vec2 g = vWorld.xz / 36.0;
    float grid = max(lineAA(g.x, 0.9), lineAA(g.y, 0.9));
    // small survey crosses at every grid node
    vec2 cell = abs(fract(vWorld.xz / 12.0 + 0.5) - 0.5) * 12.0;
    float cross = (1.0 - smoothstep(0.0, 0.06, min(cell.x, cell.y))) * (1.0 - smoothstep(0.35, 0.45, max(cell.x, cell.y)));

    float relief = smoothstep(-2.0, 46.0, h);
    vec3 col = uBase * (0.6 + 0.8 * relief);

    float d = length(vWorld.xz - uCam.xz);
    float near = exp(-d * 0.018);
    float ink = minor * 0.16 + major * 0.42 + grid * 0.07 + cross * 0.22;
    col += uLine * ink * (0.45 + near * 1.1);

    float scan = exp(-abs(vWorld.z - uScanZ) * 0.45) * smoothstep(160.0, 20.0, d);
    col += uAccent * scan * (minor * 1.1 + major * 1.6 + 0.04);

    float fog = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
    col = mix(col, uFog, clamp(fog, 0.0, 1.0));
    gl_FragColor = vec4(col, 1.0);
  }
`

export function Terrain({ detail = 1 }: { detail?: number }) {
  const material = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => {
    const depth = TERRAIN.zStart - TERRAIN.zEnd
    const geo = new THREE.PlaneGeometry(TERRAIN.width, depth, Math.round(230 * detail), Math.round(400 * detail))
    geo.rotateX(-Math.PI / 2)
    geo.translate(0, 0, (TERRAIN.zStart + TERRAIN.zEnd) / 2)
    const pos = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)))
    }
    geo.computeVertexNormals()
    return geo
  }, [detail])

  const uniforms = useMemo(
    () => ({
      uBase: { value: new THREE.Color(COLORS.ground) },
      uLine: { value: new THREE.Color(COLORS.contour) },
      uAccent: { value: new THREE.Color(COLORS.signal).multiplyScalar(1.4) },
      uFog: { value: new THREE.Color(COLORS.night) },
      uFogDensity: { value: FOG_DENSITY },
      uCam: { value: new THREE.Vector3() },
      uScanZ: { value: 0 },
    }),
    [],
  )

  useFrame(({ camera, clock }) => {
    const u = material.current?.uniforms
    if (!u) return
    u.uCam.value.copy(camera.position)
    u.uScanZ.value = camera.position.z - 10 - ((clock.elapsedTime * 26) % 150)
  })

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <shaderMaterial ref={material} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} />
    </mesh>
  )
}
