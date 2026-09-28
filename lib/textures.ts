import * as THREE from 'three'
import { identity } from './content'
import { brands } from './portfolio-data'
import { COLORS, MODEL } from './scene-config'

/**
 * Everything printed in the model is drawn here, with the site's own fonts:
 * the 4 × 3 poster, the drafting sheet and the plinth's label card.
 * No image files to download; the fonts are the only assets.
 */

const FONTS = {
  display: '"Gloock", Georgia, serif',
  sans: '"Archivo Variable", "Archivo", Arial, sans-serif',
  mono: '"Martian Mono", ui-monospace, monospace',
}

export async function loadFonts() {
  if (typeof document === 'undefined' || !document.fonts) return
  await Promise.all([
    document.fonts.load(`400 200px ${FONTS.display}`),
    document.fonts.load(`500 60px ${FONTS.sans}`),
    document.fonts.load(`400 40px ${FONTS.mono}`),
  ])
}

/**
 * Generated material photographs (Higgsfield) live in public/textures.
 * They are optional: when a file is missing the procedural version is used.
 */
export const MATERIALS = {
  oak: 'textures/oak.jpg',
  paper: 'textures/paper.jpg',
  proof: 'textures/proof.jpg',
  listing: 'textures/listing.jpg',
  kraft: 'textures/kraft.jpg',
}

/** A loaded material photograph as a colour texture (null while missing). */
export function photoTexture(img: HTMLImageElement | null, repeat: [number, number] = [1, 1]) {
  if (!img) return null
  const t = new THREE.Texture(img)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(...repeat)
  t.anisotropy = 8
  t.needsUpdate = true
  return t
}

export function loadImage(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount
    d[i] += n
    d[i + 1] += n
    d[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
}

/** Registration mark, as printers put in the margins. */
function registration(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.moveTo(x - r * 1.6, y)
  ctx.lineTo(x + r * 1.6, y)
  ctx.moveTo(x, y - r * 1.6)
  ctx.lineTo(x, y + r * 1.6)
  ctx.stroke()
}

function texture(c: HTMLCanvasElement, anisotropy = 8) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = anisotropy
  return t
}

/** The 4 × 3 poster, pasted in three strips like the real thing. */
export function posterTexture() {
  const W = 2048
  const H = 1536
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = COLORS.paper
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = COLORS.ink
  ctx.textBaseline = 'alphabetic'
  ctx.font = `400 34px ${FONTS.mono}`
  ctx.fillText('01 / 05', 96, 132)
  ctx.fillStyle = COLORS.graphite
  ctx.fillText('Signal', 290, 132)
  ctx.textAlign = 'right'
  ctx.fillText('4 × 3 m', W - 96, 132)
  ctx.textAlign = 'left'

  // the name, set big and tight, as posters are
  ctx.fillStyle = COLORS.ink
  // largest size at which the whole name, full stop included, fits the margins
  let size = 620
  ctx.font = `400 ${size}px ${FONTS.display}`
  const room = W - 96 * 2
  const width = ctx.measureText(identity.name).width
  if (width > room) {
    size = Math.floor((size * room) / width)
    ctx.font = `400 ${size}px ${FONTS.display}`
  }
  ctx.fillText(identity.name, 88, 930)

  ctx.fillRect(96, 1130, W - 192, 3)
  ctx.font = `500 78px ${FONTS.sans}`
  ctx.fillText(identity.role, 96, 1262)
  ctx.font = `400 38px ${FONTS.mono}`
  ctx.fillStyle = COLORS.graphite
  ctx.fillText(`Depuis ${identity.since} · ${brands.length} marques`, 96, 1352)

  // the one red mark: the signal
  ctx.fillStyle = COLORS.red
  ctx.beginPath()
  ctx.arc(W - 150, 1236, 40, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 2
  for (const [x, y] of [
    [48, 48],
    [W - 48, 48],
    [48, H - 48],
    [W - 48, H - 48],
  ])
    registration(ctx, x, y, 14)

  // paste seams between the three strips, never perfectly aligned
  for (const x of [W / 3, (2 * W) / 3]) {
    ctx.fillStyle = 'rgba(20,20,20,0.07)'
    ctx.fillRect(x - 1, 0, 3, H)
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fillRect(x + 2, 0, 2, H)
  }
  grain(ctx, W, H, 14)
  return texture(c, 16)
}

/** Drafting sheet under the model: 1 cm grid, title block, scale bar. */
export const SHEET = { w: 170, d: 140, cx: -4, cz: -16 }

export function sheetTexture(paper?: HTMLImageElement | null) {
  const PX = 16 // px per cm
  const W = SHEET.w * PX
  const H = SHEET.d * PX
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = COLORS.sheet
  ctx.fillRect(0, 0, W, H)
  if (paper) {
    // photographed paper fibre, tiled every 32 cm and tinted to the sheet
    const tile = 32 * PX
    ctx.globalAlpha = 0.55
    ctx.globalCompositeOperation = 'multiply'
    for (let x = 0; x < W; x += tile) for (let y = 0; y < H; y += tile) ctx.drawImage(paper, x, y, tile, tile)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  for (let i = 0; i <= SHEET.w; i++) {
    ctx.fillStyle = i % 5 === 0 ? 'rgba(60,56,50,0.16)' : 'rgba(60,56,50,0.07)'
    ctx.fillRect(i * PX, 0, i % 5 === 0 ? 2 : 1, H)
  }
  for (let j = 0; j <= SHEET.d; j++) {
    ctx.fillStyle = j % 5 === 0 ? 'rgba(60,56,50,0.16)' : 'rgba(60,56,50,0.07)'
    ctx.fillRect(0, j * PX, W, j % 5 === 0 ? 2 : 1)
  }

  // sheet coordinates of a world point (x, z)
  const sx = (x: number) => (x - (SHEET.cx - SHEET.w / 2)) * PX
  const sz = (z: number) => (z - (SHEET.cz - SHEET.d / 2)) * PX

  // scale bar in front of the plinth: at 1:50, 1 m is 2 cm
  const bx = sx(-MODEL.plinth.w / 2)
  const bz = sz(MODEL.plinth.d / 2 + 3.2)
  ctx.fillStyle = COLORS.ink
  for (let m = 0; m < 5; m++) {
    if (m % 2 === 0) ctx.fillRect(bx + m * 2 * PX, bz, 2 * PX, 8)
  }
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 2
  ctx.strokeRect(bx, bz, 10 * PX, 8)
  ctx.font = `400 15px ${FONTS.mono}`
  ctx.textAlign = 'center'
  for (const m of [0, 1, 2, 5]) ctx.fillText(`${m}`, bx + m * 2 * PX, bz + 30)
  ctx.textAlign = 'left'
  ctx.fillText('m', bx + 10 * PX + 12, bz + 30)
  ctx.fillText('Éch. 1:50', bx, bz - 12)

  // title block, bottom right of the sheet, as on any drawing
  const tw = 30 * PX
  const th = 12 * PX
  const tx = sx(-MODEL.plinth.w / 2 + 14)
  const tz = sz(MODEL.plinth.d / 2 + 2.4)
  ctx.lineWidth = 2
  ctx.strokeRect(tx, tz, tw, th)
  ctx.beginPath()
  ctx.moveTo(tx, tz + th * 0.55)
  ctx.lineTo(tx + tw, tz + th * 0.55)
  ctx.moveTo(tx + tw * 0.62, tz + th * 0.55)
  ctx.lineTo(tx + tw * 0.62, tz + th)
  ctx.stroke()
  ctx.font = `400 46px ${FONTS.display}`
  ctx.fillText(identity.name, tx + 20, tz + 66)
  ctx.font = `400 15px ${FONTS.mono}`
  ctx.fillText('Portfolio en cinq actes — maquette 01 : Signal', tx + 20, tz + 94)
  ctx.fillText(identity.role, tx + 20, tz + th * 0.55 + 36)
  ctx.fillText(`${identity.since} — ${new Date().getFullYear()}`, tx + 20, tz + th * 0.55 + 62)
  ctx.fillText('Éch. 1:50', tx + tw * 0.62 + 20, tz + th * 0.55 + 36)
  ctx.fillText('Planche 01 / 05', tx + tw * 0.62 + 20, tz + th * 0.55 + 62)

  ctx.lineWidth = 1.5
  registration(ctx, sx(SHEET.cx - SHEET.w / 2) + 40, sz(SHEET.cz - SHEET.d / 2) + 40, 12)
  registration(ctx, sx(SHEET.cx + SHEET.w / 2) - 40, sz(SHEET.cz + SHEET.d / 2) - 40, 12)

  if (!paper) grain(ctx, W, H, 10)
  return texture(c, 16)
}

/** Table top: the photographed oak when present, else a dark procedural grain. */
export function tableTexture(oak?: HTMLImageElement | null) {
  if (oak) {
    const t = new THREE.Texture(oak)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(14, 14)
    t.anisotropy = 8
    t.needsUpdate = true
    return t
  }
  const W = 512
  const [c, ctx] = canvas(W, W)
  ctx.fillStyle = '#1d1a16'
  ctx.fillRect(0, 0, W, W)
  for (let x = 0; x < W; x += 2) {
    const v = Math.sin(x * 0.05 + Math.sin(x * 0.013) * 4) * 0.5 + 0.5
    ctx.fillStyle = `rgba(0,0,0,${0.12 + v * 0.18})`
    ctx.fillRect(x, 0, 1 + (v > 0.8 ? 1 : 0), W)
  }
  grain(ctx, W, W, 8)
  const t = texture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(14, 14)
  return t
}

/** The small card glued on the plinth. */
export function labelTexture() {
  const W = 1024
  const H = 512
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = '#f6f3ee'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = COLORS.ink
  ctx.font = `400 34px ${FONTS.mono}`
  ctx.fillText('Maquette 01', 56, 92)
  ctx.font = `400 170px ${FONTS.display}`
  ctx.fillText('Signal', 50, 300)
  ctx.fillRect(56, 350, W - 112, 2)
  ctx.font = `400 30px ${FONTS.mono}`
  ctx.fillStyle = COLORS.graphite
  ctx.fillText('Panneau 4 × 3, éch. 1:50', 56, 420)
  grain(ctx, W, H, 10)
  return texture(c)
}
