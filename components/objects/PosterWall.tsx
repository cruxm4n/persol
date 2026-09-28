'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { RoundedBox } from '@react-three/drei'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { loadImage } from '@/lib/asset-manifest'
import { experience } from '@/lib/experience-store'
import { placeholderTexture, print, surfaceMaterial, toon } from '@/lib/materials'
import { PALETTE } from '@/lib/scene-config'

/**
 * A texture that shows a placeholder at once and the real image as soon as
 * it has loaded. A missing image leaves the placeholder: nothing breaks.
 */
export function useImageTexture(url: string | undefined, label: string) {
  const placeholder = useMemo<THREE.Texture>(() => placeholderTexture(label), [label])
  const [tex, setTex] = useState<THREE.Texture>(placeholder)
  useEffect(() => {
    if (!url) return
    let alive = true
    loadImage(url).then((img) => {
      if (!alive || !img) return
      const t = new THREE.Texture(img)
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      t.needsUpdate = true
      setTex(t)
    })
    return () => {
      alive = false
    }
  }, [url])
  return tex
}

/**
 * A poster board on two legs. It starts turned away (its kraft back to the
 * path) and swings round when `turn(progress)` goes from 0 to 1, so the
 * street wakes up as the camera walks in.
 */
export function PosterWall({
  image,
  map,
  label,
  w = 2.2,
  h = 3,
  turn,
  ...group
}: {
  image?: string
  /** a texture painted in code (a figure), used instead of an image */
  map?: THREE.Texture
  label: string
  w?: number
  h?: number
  turn: (p: number) => number
} & ThreeElements['group']) {
  const board = useRef<THREE.Group>(null)
  const loaded = useImageTexture(image, label)
  const tex = map ?? loaded
  const front = useMemo(() => print(tex), [tex])
  const legH = 1.1

  useFrame((_, dt) => {
    if (!board.current) return
    const k = turn(experience.smooth)
    const target = Math.PI * (1 - k)
    board.current.rotation.y = experience.reducedMotion ? target : THREE.MathUtils.damp(board.current.rotation.y, target, 6, dt)
  })

  return (
    <group {...group}>
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.14, legH + h * 0.5, 0.14]} radius={0.04} position={[s * (w / 2 - 0.1), (legH + h * 0.5) / 2, -0.12]} material={toon(PALETTE.woodDark)} castShadow />
      ))}
      <group ref={board} position={[0, legH + h / 2, 0]} rotation-y={Math.PI}>
        <RoundedBox args={[w + 0.18, h + 0.18, 0.12]} radius={0.05} material={toon(PALETTE.wood)} castShadow receiveShadow />
        <mesh position={[0, 0, 0.065]} material={front}>
          <planeGeometry args={[w, h]} />
        </mesh>
        <mesh position={[0, 0, -0.065]} rotation-y={Math.PI} material={surfaceMaterial('planks', PALETTE.wood, [0.6, 0.6])}>
          <planeGeometry args={[w, h]} />
        </mesh>
      </group>
    </group>
  )
}
