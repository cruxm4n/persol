import * as THREE from 'three'
import { PALETTE } from './scene-config'

/**
 * The island's look: soft toon shading (a gentle five-step ramp), and every
 * surface painted here in code. No image is required: until real visuals
 * exist, posters and screens show honest placeholders.
 */

export const FONTS = {
  display: '"Fraunces Variable", "Fraunces", Georgia, serif',
  sans: '"Figtree Variable", "Figtree", Arial, sans-serif',
}

export async function loadFonts() {
  if (typeof document === 'undefined' || !document.fonts) return
  await Promise.all([document.fonts.load(`500 120px ${FONTS.display}`), document.fonts.load(`500 40px ${FONTS.sans}`)])
}

/** Shared clock for everything that sways; frozen when motion is reduced. */
export const wind = { uTime: { value: 0 } }

let ramp: THREE.DataTexture | null = null
function toonRamp() {
  if (ramp) return ramp
  const steps = [118, 158, 196, 230, 255]
  const data = new Uint8Array(steps.length * 4)
  steps.forEach((v, i) => data.set([v, v, v, 255], i * 4))
  ramp = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat)
  ramp.minFilter = ramp.magFilter = THREE.LinearFilter
  ramp.needsUpdate = true
  return ramp
}

const cache = new Map<string, THREE.Material>()

/** One toon material per colour (and texture), shared across the island. */
export function toon(color: string, opts: { map?: THREE.Texture | null; emissive?: string; key?: string } = {}) {
  const key = opts.key ?? `${color}|${opts.map?.uuid ?? ''}|${opts.emissive ?? ''}`
  let m = cache.get(key) as THREE.MeshToonMaterial | undefined
  if (!m) {
    m = new THREE.MeshToonMaterial({
      color,
      gradientMap: toonRamp(),
      map: opts.map ?? null,
      emissive: opts.emissive ? new THREE.Color(opts.emissive) : new THREE.Color(0x000000),
    })
    cache.set(key, m)
  }
  return m
}

/**
 * Foliage that breathes: the vertex shader bends the top of each instance
 * with the wind, phase-shifted by its position so trees never sway together.
 */
export function windy(color: string, strength = 1) {
  const key = `wind|${color}|${strength}`
  let m = cache.get(key) as THREE.MeshToonMaterial | undefined
  if (m) return m
  m = new THREE.MeshToonMaterial({ color, gradientMap: toonRamp() })
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = wind.uTime
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec3 root = vec3(0.0);
        #ifdef USE_INSTANCING
          root = instanceMatrix[3].xyz;
        #endif
        float bend = max(position.y + 0.6, 0.0) * ${(0.05 * strength).toFixed(3)};
        float phase = root.x * 0.35 + root.z * 0.27;
        transformed.x += sin(uTime * 1.3 + phase) * bend;
        transformed.z += cos(uTime * 1.05 + phase * 1.3) * bend * 0.6;`,
      )
  }
  cache.set(key, m)
  return m
}

// ---------- surfaces: generated image when present, painted in code otherwise ----------

export type SurfaceId = 'grass' | 'sand' | 'planks' | 'roof' | 'listing'

/** Generated surfaces (image-use), optimised into public/assets/generated. */
export const SURFACE_FILES: Record<SurfaceId, string> = {
  grass: 'assets/generated/arrival/grass.webp',
  sand: 'assets/generated/arrival/sand.webp',
  planks: 'assets/generated/arrival/planks.webp',
  roof: 'assets/generated/community/roof.webp',
  listing: 'assets/generated/system/listing.webp',
}

/** World-space size of one tile, in metres (UVs of the island are in metres). */
const SURFACE_REPEAT: Record<SurfaceId, [number, number]> = {
  grass: [1 / 7, 1 / 7],
  sand: [1 / 6, 1 / 6],
  planks: [1 / 3, 1 / 3],
  roof: [0.5, 0.5],
  listing: [1, 1],
}

const surfaceCache = new Map<string, THREE.MeshToonMaterial>()

/**
 * A toon material carrying a surface. It starts with the painted version
 * (white-ish, tinted by `tint`) and swaps to the generated image as soon as
 * it has loaded, turning the tint off: the image already has its colours.
 * A missing file just leaves the painted version in place.
 */
export function surfaceMaterial(id: SurfaceId, tint: string, repeat?: [number, number]) {
  const key = `${id}|${tint}|${repeat?.join(',') ?? ''}`
  let m = surfaceCache.get(key)
  if (m) return m
  const painted = surfaces[id]()
  painted.repeat.set(...(repeat ?? SURFACE_REPEAT[id]))
  m = new THREE.MeshToonMaterial({ color: tint, map: painted, gradientMap: toonRamp() })
  surfaceCache.set(key, m)
  const mat = m
  // the generated roof is terracotta: other roof colours keep their painted tiles
  const photo = id !== 'roof' || tint.toLowerCase() === PALETTE.roof
  if (photo && typeof window !== 'undefined') {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      const t = new THREE.Texture(img)
      t.colorSpace = THREE.SRGBColorSpace
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.anisotropy = 8
      t.repeat.copy(painted.repeat)
      t.needsUpdate = true
      mat.map = t
      // a hint of the tint keeps it in the island's palette
      mat.color.set('#ffffff').lerp(new THREE.Color(tint), 0.12)
      mat.needsUpdate = true
      painted.dispose()
    }
    img.src = SURFACE_FILES[id]
  }
  return m
}

// ---------- painted surfaces ----------

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function toTexture(c: HTMLCanvasElement, repeat?: [number, number]) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(...repeat)
  }
  return t
}

/** A small seeded random, so the painted surfaces are the same on every visit. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

/** Speckles of a lighter and a darker tone on a base colour: grass, sand. */
function speckled(base: string, light: string, dark: string, seed: number, count: number, size: number) {
  const W = 256
  const [c, ctx] = canvas(W, W)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, W, W)
  const r = rng(seed)
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = r() > 0.5 ? light : dark
    ctx.globalAlpha = 0.25 + r() * 0.35
    const x = r() * W
    const y = r() * W
    const s = size * (0.5 + r())
    // drawn on every edge it touches so the tile repeats without seams
    for (const dx of [-W, 0, W]) for (const dy of [-W, 0, W]) {
      ctx.beginPath()
      ctx.ellipse(x + dx, y + dy, s, s * 0.6, r() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
  return c
}

export const surfaces = {
  grass: () => toTexture(speckled('#ffffff', '#f4f8e8', '#dfe6cc', 7, 900, 3), [1, 1]),
  sand: () => toTexture(speckled('#ffffff', '#fffaf0', '#efe3cc', 11, 700, 2), [1, 1]),
  planks: () => {
    const W = 256
    const [c, ctx] = canvas(W, W)
    const r = rng(3)
    for (let i = 0; i < 8; i++) {
      const v = 0.92 + r() * 0.08
      ctx.fillStyle = `rgb(${255 * v},${250 * v},${242 * v})`
      ctx.fillRect(0, i * 32, W, 32)
      ctx.fillStyle = 'rgba(80,55,35,0.35)'
      ctx.fillRect(0, i * 32, W, 2)
      ctx.fillRect(((i * 97) % W) | 0, i * 32, 2, 32)
      ctx.fillStyle = 'rgba(80,55,35,0.08)'
      for (let g = 0; g < 5; g++) ctx.fillRect(0, i * 32 + 6 + g * 5 + r() * 3, W, 1)
    }
    return toTexture(c, [1, 1])
  },
  listing: () => {
    const W = 256
    const [c, ctx] = canvas(W, W)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, W)
    ctx.fillStyle = 'rgba(150,200,160,0.35)'
    for (let i = 0; i < 8; i += 2) ctx.fillRect(24, i * 32, W - 48, 32)
    ctx.fillStyle = 'rgba(44,42,51,0.18)'
    for (let y = 8; y < W; y += 16) for (const x of [10, W - 10]) {
      ctx.beginPath()
      ctx.arc(x, y, 3.5, 0, Math.PI * 2)
      ctx.fill()
    }
    return toTexture(c, [1, 1])
  },
  roof: () => {
    const W = 256
    const [c, ctx] = canvas(W, W)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, W)
    for (let row = 0; row < 8; row++) {
      for (let col = -1; col < 9; col++) {
        const x = col * 32 + (row % 2) * 16
        ctx.fillStyle = 'rgba(90,40,20,0.14)'
        ctx.beginPath()
        ctx.arc(x + 16, row * 32 + 30, 16, 0, Math.PI)
        ctx.fill()
      }
    }
    return toTexture(c, [1, 1])
  },
}

/**
 * A poster or screen waiting for its visual: paper, a margin, a thin
 * cross, a quiet caption. It says what it is — nothing pretends to be a campaign.
 */
export function placeholderTexture(label: string, tone = PALETTE.wall, w = 768, h = 1024) {
  const [c, ctx] = canvas(w, h)
  ctx.fillStyle = tone
  ctx.fillRect(0, 0, w, h)
  const m = Math.round(w * 0.07)
  ctx.strokeStyle = 'rgba(44,42,51,0.28)'
  ctx.lineWidth = 3
  ctx.strokeRect(m, m, w - m * 2, h - m * 2)
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(44,42,51,0.14)'
  ctx.beginPath()
  ctx.moveTo(m, m)
  ctx.lineTo(w - m, h - m)
  ctx.moveTo(w - m, m)
  ctx.lineTo(m, h - m)
  ctx.stroke()
  // caption on a paper band so it reads over the cross
  ctx.font = `500 ${Math.round(w * 0.05)}px ${FONTS.sans}`
  const text = 'Visuel à venir'
  const tw = ctx.measureText(text).width
  ctx.fillStyle = tone
  ctx.fillRect(w / 2 - tw / 2 - 24, h / 2 - w * 0.05, tw + 48, w * 0.09)
  ctx.fillStyle = 'rgba(44,42,51,0.62)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, w / 2, h / 2)
  ctx.font = `500 ${Math.round(w * 0.035)}px ${FONTS.sans}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = 'rgba(44,42,51,0.45)'
  ctx.fillText(label, m + 18, h - m - 18)
  return toTexture(c)
}

/** A painted wooden sign: a word in Fraunces on a board. */
export function signTexture(text: string, sub?: string, board = PALETTE.wood) {
  const W = 1024
  const H = 400
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = board
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(60,40,25,0.12)'
  for (let i = 0; i < 12; i++) ctx.fillRect(0, 20 + i * 32 + (i % 3) * 3, W, 2)
  ctx.fillStyle = PALETTE.wall
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let size = 170
  ctx.font = `500 ${size}px ${FONTS.display}`
  const width = ctx.measureText(text).width
  if (width > W * 0.84) {
    size = Math.floor((size * W * 0.84) / width)
    ctx.font = `500 ${size}px ${FONTS.display}`
  }
  ctx.fillText(text, W / 2, sub ? H * 0.44 : H / 2)
  if (sub) {
    ctx.font = `500 44px ${FONTS.sans}`
    ctx.globalAlpha = 0.8
    ctx.fillText(sub, W / 2, H * 0.78)
  }
  return toTexture(c)
}
