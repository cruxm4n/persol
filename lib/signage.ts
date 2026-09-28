import * as THREE from 'three'
import { FONTS } from './materials'
import { PALETTE } from './scene-config'

/**
 * The figures of the portfolio, painted where they belong in the island:
 * a poster in the street, a banner over the village square, the studio's
 * shop sign, the screens of the workshop. Same fonts as the page.
 */

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function toTexture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 16
  return t
}

/** Largest font size (px) at which `text` fits `maxW`, from `size` down. */
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, family: string, size: number, maxW: number) {
  ctx.font = `${weight} ${size}px ${family}`
  const w = ctx.measureText(text).width
  if (w > maxW) size = Math.floor((size * maxW) / w)
  ctx.font = `${weight} ${size}px ${family}`
  return size
}

/** Risograph grain: tiny specks, so flat shapes read as print. */
function grain(ctx: CanvasRenderingContext2D, w: number, h: number) {
  let s = 11
  const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
  ctx.fillStyle = 'rgba(60,45,30,0.07)'
  for (let i = 0; i < (w * h) / 260; i++) ctx.fillRect(r() * w, r() * h, 2, 2)
}

/**
 * A campaign-style poster carrying one figure: big number, its label, a
 * couple of soft printed shapes behind. `tone` picks the shapes' colours.
 */
export function figurePoster(value: string, label: string, tone: 'sage' | 'terracotta') {
  const W = 768
  const H = 1024
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = '#f4ecdc'
  ctx.fillRect(0, 0, W, H)
  const [a, b] = tone === 'sage' ? [PALETTE.grass, PALETTE.lagoon] : [PALETTE.roof, PALETTE.roofSand]
  ctx.globalAlpha = 0.85
  ctx.fillStyle = a
  ctx.beginPath()
  ctx.arc(W * 0.66, H * 0.3, W * 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = b
  ctx.beginPath()
  ctx.moveTo(W * 0.1, H * 0.62)
  ctx.lineTo(W * 0.1, H * 0.34)
  ctx.arc(W * 0.3, H * 0.34, W * 0.2, Math.PI, 0)
  ctx.lineTo(W * 0.5, H * 0.62)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1
  // the one red dot of the island's print
  ctx.fillStyle = PALETTE.red
  ctx.beginPath()
  ctx.arc(W * 0.84, H * 0.1, 18, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = PALETTE.ink
  ctx.textBaseline = 'alphabetic'
  fit(ctx, value, 500, FONTS.display, 300, W * 0.84)
  ctx.fillText(value, W * 0.07, H * 0.84)
  fit(ctx, label, 650, FONTS.sans, 64, W * 0.84)
  ctx.fillText(label, W * 0.08, H * 0.93)
  grain(ctx, W, H)
  return toTexture(c)
}

/** A cloth banner, hung over the village square. */
export function clothBanner(value: string, label: string) {
  const W = 1200
  const H = 400
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = '#f6efe2'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = PALETTE.roof
  ctx.lineWidth = 16
  ctx.strokeRect(22, 22, W - 44, H - 44)
  ctx.fillStyle = PALETTE.ink
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'right'
  const size = fit(ctx, value, 500, FONTS.display, 230, W * 0.46)
  ctx.fillText(value, W * 0.54, H * 0.54)
  ctx.textAlign = 'left'
  fit(ctx, label, 650, FONTS.sans, Math.round(size * 0.42), W * 0.36)
  ctx.fillText(label, W * 0.58, H * 0.56)
  grain(ctx, W, H)
  return toTexture(c)
}

/** The studio's shop sign, painted on a wooden board. */
export function shopSign(value: string, label: string) {
  const W = 1200
  const H = 420
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = PALETTE.wood
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(60,40,25,0.12)'
  for (let i = 0; i < 12; i++) ctx.fillRect(0, 22 + i * 34 + (i % 3) * 4, W, 2)
  ctx.fillStyle = PALETTE.wall
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'right'
  const size = fit(ctx, value, 500, FONTS.display, 250, W * 0.48)
  ctx.fillText(value, W * 0.55, H * 0.54)
  ctx.textAlign = 'left'
  fit(ctx, label, 650, FONTS.sans, Math.round(size * 0.36), W * 0.36)
  ctx.fillText(label, W * 0.59, H * 0.56)
  return toTexture(c)
}

/** A workshop module's screen: the name of a stack, lit. */
export function moduleScreen(title: string, lines: string[]) {
  const W = 768
  const H = 384
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = '#fbf6ea'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = PALETTE.ink
  ctx.textBaseline = 'alphabetic'
  fit(ctx, title, 700, FONTS.sans, 64, W * 0.88)
  ctx.fillText(title, W * 0.06, H * 0.24)
  ctx.fillStyle = '#5d5a63'
  const size = lines.length > 5 ? 38 : 42
  ctx.font = `500 ${size}px ${FONTS.sans}`
  // two columns when the list is long
  const col = lines.length > 3 ? Math.ceil(lines.length / 2) : lines.length
  lines.forEach((l, i) => {
    const x = W * (i < col ? 0.06 : 0.52)
    const y = H * 0.44 + (i % col) * size * 1.35
    ctx.fillText(l, x, y, W * 0.44)
  })
  return toTexture(c)
}
