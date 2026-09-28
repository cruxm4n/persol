'use client'

import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { print, signTexture, toon } from '@/lib/materials'
import { PALETTE } from '@/lib/scene-config'

/** A wooden signpost: a painted word on a board, on a post. */
export function InteractiveSign({
  text,
  sub,
  width = 2.6,
  height = 2.2,
  ...group
}: { text: string; sub?: string; width?: number; height?: number } & ThreeElements['group']) {
  const face = useMemo(() => print(signTexture(text, sub)), [text, sub])
  const boardH = width * 0.39
  return (
    <group {...group}>
      <RoundedBox args={[0.18, height, 0.18]} radius={0.05} position={[0, height / 2, 0]} material={toon(PALETTE.woodDark)} castShadow />
      <group position={[0, height + boardH / 2 - 0.1, 0.12]}>
        <RoundedBox args={[width + 0.16, boardH + 0.16, 0.12]} radius={0.05} material={toon(PALETTE.woodDark)} castShadow />
        <mesh position={[0, 0, 0.065]} material={face}>
          <planeGeometry args={[width, boardH]} />
        </mesh>
      </group>
    </group>
  )
}
