import * as THREE from 'three'

/**
 * Direction artistique de l'île : la palette officielle, et la rampe de
 * toon partagée par tous les matériaux. Toute couleur de la scène vient
 * d'ici (les teintes dérivées sont calculées à partir de la palette).
 * Aucune couleur n'est saturée à 100 %.
 */
export const DA = {
  sky: '#aee7ff',
  sea: '#4fc3d9',
  grass: '#8bd450',
  cliff: '#e0b085',
  path: '#f2e2b6',
  trunk: '#b58a5e',
  foliage: '#6fcf6f',
  roofs: '#ff8b6b',
  accent: '#fff3c9',
}

export type DaKey = keyof typeof DA

const mix = (a: string, b: string, t: number) => `#${new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()}`
const shade = (c: string, k: number) => `#${new THREE.Color(c).multiplyScalar(k).getHexString()}`

/**
 * Teintes secondaires, toutes dérivées de la palette officielle : les
 * variations de feuillage et d'herbe, les murs crème, les bois, la pierre,
 * les toits d'autres couleurs du village, l'encre des détails.
 */
export function derived() {
  return {
    grassDeep: shade(DA.grass, 0.82),
    foliageLight: mix(DA.foliage, DA.accent, 0.3),
    foliageDeep: shade(DA.foliage, 0.8),
    wall: mix(DA.accent, '#ffffff', 0.45),
    wallWarm: mix(DA.accent, DA.cliff, 0.25),
    wood: mix(DA.trunk, DA.cliff, 0.35),
    woodDark: shade(DA.trunk, 0.72),
    stone: mix(DA.cliff, '#e8e4dc', 0.6),
    roofSage: mix(DA.foliage, DA.accent, 0.2),
    roofTeal: mix(DA.sea, DA.accent, 0.25),
    roofSand: mix(DA.cliff, DA.accent, 0.3),
    ink: '#3b3a45',
    cloud: '#ffffff',
    lamp: mix(DA.accent, '#ffd27a', 0.4),
  }
}

let ramp: THREE.DataTexture | null = null

/**
 * La rampe de toon : 4 tons, du creux de l'ombre à la pleine lumière, en
 * NearestFilter pour des aplats nets. Partagée par tous les MeshToonMaterial.
 */
export function toonRamp() {
  if (ramp) return ramp
  ramp = new THREE.DataTexture(new Uint8Array([118, 172, 218, 255]), 4, 1, THREE.RedFormat)
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter
  ramp.generateMipmaps = false
  ramp.needsUpdate = true
  return ramp
}
