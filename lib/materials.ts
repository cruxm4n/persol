import * as THREE from 'three'
import { toonRamp } from './da'
import { PALETTE } from './scene-config'

/**
 * The island's look: every material is a MeshToonMaterial on the shared
 * 4-tone ramp of lib/da.ts. No PBR, no specular, no flat shading. Things
 * that give light (windows, lamps, screens) are toon materials too, lit by
 * their emissive colour. Surfaces are painted in code; generated images only
 * add grain, the colour always comes from the palette.
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

const cache = new Map<string, THREE.Material>()

type ToonOptions = {
  map?: THREE.Texture | null
  emissive?: string
  side?: THREE.Side
  transparent?: boolean
  key?: string
}

/** One toon material per colour (and texture, side…), shared across the island. */
export function toon(color: string, opts: ToonOptions = {}) {
  const key = opts.key ?? `${color}|${opts.map?.uuid ?? ''}|${opts.emissive ?? ''}|${opts.side ?? 0}|${opts.transparent ? 1 : 0}`
  let m = cache.get(key) as THREE.MeshToonMaterial | undefined
  if (!m) {
    m = new THREE.MeshToonMaterial({
      color,
      gradientMap: toonRamp(),
      map: opts.map ?? null,
      emissive: opts.emissive ? new THREE.Color(opts.emissive) : new THREE.Color(0x000000),
      side: opts.side ?? THREE.FrontSide,
      transparent: !!opts.transparent,
    })
    cache.set(key, m)
  }
  return m
}

/**
 * Something that gives light: a toon material whose colour is all emissive.
 * Not shared, because its glow is animated (change `.emissive`).
 */
export function glow(color: string | THREE.Color, intensity = 1, opts: { transparent?: boolean; additive?: boolean } = {}) {
  return new THREE.MeshToonMaterial({
    color: 0x000000,
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    gradientMap: toonRamp(),
    transparent: !!opts.transparent || !!opts.additive,
    blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: !opts.additive,
    side: opts.additive ? THREE.DoubleSide : THREE.FrontSide,
  })
}

/** A lit screen: its picture shows at full strength whatever the light. */
export function screen(map: THREE.Texture) {
  return new THREE.MeshToonMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: map, gradientMap: toonRamp() })
}

/** A printed surface (poster, sign, banner): its picture, shaded like the rest. */
export function print(map: THREE.Texture, side: THREE.Side = THREE.FrontSide) {
  return new THREE.MeshToonMaterial({ color: 0xffffff, map, gradientMap: toonRamp(), side })
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
  m.customProgramCacheKey = () => key
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
 * The generated image turned into grain only: its luminance, centred just
 * under white, with the colour removed. Multiplied by the material's palette
 * colour, it adds texture without ever changing the hue.
 */
function grainOf(img: HTMLImageElement) {
  const size = Math.min(512, img.width)
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  ctx.drawImage(img, 0, 0, size, size)
  const data = ctx.getImageData(0, 0, size, size)
  const d = data.data
  let sum = 0
  for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]
  const mean = sum / (d.length / 4)
  for (let i = 0; i < d.length; i += 4) {
    const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]
    const v = Math.round(255 * Math.min(1, Math.max(0.74, 0.93 + ((l - mean) / 255) * 0.55)))
    d[i] = d[i + 1] = d[i + 2] = v
  }
  ctx.putImageData(data, 0, 0)
  const t = new THREE.CanvasTexture(c)
  // a plain multiplier: no colour-space conversion
  t.colorSpace = THREE.NoColorSpace
  return t
}

/**
 * A toon material carrying a surface. Its colour is the palette colour
 * (`tint`); the painted grain is replaced by the generated image's grain as
 * soon as it has loaded. The listing paper keeps its printed colours. A
 * missing file just leaves the painted grain in place.
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
  if (typeof window !== 'undefined') {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      const keepColour = id === 'listing'
      const t = keepColour ? new THREE.Texture(img) : grainOf(img)
      if (keepColour) t.colorSpace = THREE.SRGBColorSpace
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.anisotropy = 8
      t.repeat.copy(painted.repeat)
      t.needsUpdate = true
      mat.map = t
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
