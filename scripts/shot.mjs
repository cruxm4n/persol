// Screenshots of the walk, and an audit of the live scene.
//
//   npm run shot                         captures at the default route stops (1440×900)
//   npm run shot -- --label step-a       writes into shots/step-a/
//   npm run shot -- --mobile             390×844, touch, portrait path
//   npm run shot -- --at 0,0.37,0.97     choose the stops (fractions of the route)
//   npm run shot -- --audit              also dumps materials, meshes, lights, renderer
//   npm run shot -- --url http://localhost:4173
//
// Needs the dev server running (npm run dev). Uses the local Chrome
// (or CHROME_PATH) through playwright-core: nothing is downloaded.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright-core'
import sharp from 'sharp'

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const mobile = flag('mobile')
const url = opt('url', 'http://localhost:3000')
const label = opt('label', 'current')
const stops = opt('at', '0,0.08,0.21,0.37,0.55,0.73,0.97').split(',').map(Number)
const [w, h] = mobile ? [390, 844] : [Number(opt('w', 1440)), Number(opt('h', 900))]
const out = join('shots', label)
mkdirSync(out, { recursive: true })

const CHROMES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)
const executablePath = CHROMES.find((p) => existsSync(p))
if (!executablePath) throw new Error('No Chrome found: set CHROME_PATH')

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)))

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForFunction(() => document.querySelector('.hud')?.classList.contains('is-on'), null, { timeout: 90000 })
await page.waitForTimeout(3500)

const files = []
for (const p of stops) {
  await page.evaluate((p) => window.scrollTo(0, p * (document.documentElement.scrollHeight - innerHeight)), p)
  await page.waitForTimeout(3400)
  const file = join(out, `${w}x${h}-p${String(p).replace('.', '_')}.png`)
  await page.screenshot({ path: file })
  files.push(file)
}

// contact sheet: every stop side by side, two per row on landscape
const cols = mobile ? files.length : 2
const tw = mobile ? 292 : 720
const th = Math.round((tw * h) / w)
const tiles = await Promise.all(
  files.map(async (f, i) => ({
    input: await sharp(f).resize(tw, th).png().toBuffer(),
    left: (i % cols) * (tw + 10),
    top: Math.floor(i / cols) * (th + 10),
  })),
)
const rows = Math.ceil(files.length / cols)
await sharp({ create: { width: cols * (tw + 10) - 10, height: rows * (th + 10) - 10, channels: 3, background: '#ffffff' } })
  .composite(tiles)
  .png()
  .toFile(join(out, `sheet-${w}x${h}.png`))

if (flag('audit')) {
  const audit = await page.evaluate(() => {
    const scene = window.__scene
    const gl = window.__gl
    if (!scene) return { error: 'window.__scene missing: run against the dev server' }
    const hex = (c) => (c ? `#${c.getHexString()}` : null)
    const params = (g) => {
      const p = g.parameters ?? {}
      const keep = ['width', 'height', 'depth', 'radius', 'radiusTop', 'radiusBottom', 'radialSegments', 'widthSegments', 'heightSegments', 'detail', 'capSegments', 'segments', 'tubularSegments', 'length']
      return Object.fromEntries(Object.entries(p).filter(([k, v]) => keep.includes(k) && typeof v === 'number').map(([k, v]) => [k, +v.toFixed(3)]))
    }
    // share of triangles whose three vertex normals are identical: 1 = fully faceted
    const faceted = (g) => {
      const n = g.attributes.normal
      if (!n) return null
      const idx = g.index
      const tri = idx ? idx.count / 3 : n.count / 3
      const step = Math.max(1, Math.floor(tri / 400))
      let flat = 0
      let seen = 0
      for (let t = 0; t < tri; t += step) {
        const v = [0, 1, 2].map((k) => (idx ? idx.getX(t * 3 + k) : t * 3 + k))
        const same = (a, b) => Math.abs(n.getX(a) - n.getX(b)) + Math.abs(n.getY(a) - n.getY(b)) + Math.abs(n.getZ(a) - n.getZ(b)) < 1e-3
        if (same(v[0], v[1]) && same(v[1], v[2])) flat++
        seen++
      }
      return seen ? +(flat / seen).toFixed(2) : null
    }
    const materials = new Map()
    const meshes = new Map()
    scene.traverse((o) => {
      if (!o.isMesh && !o.isPoints && !o.isLine) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      const g = o.geometry
      const pos = g.attributes.position
      const tris = g.index ? g.index.count / 3 : pos.count / 3
      const count = o.isInstancedMesh ? o.count : 1
      for (const m of mats) {
        const key = m.uuid
        const e = materials.get(key) ?? {
          type: m.type,
          color: hex(m.color),
          map: m.map ? (m.map.image?.src ? m.map.image.src.split('/').slice(-2).join('/') : m.map.isCanvasTexture ? 'canvas' : m.map.image?.tagName ?? 'texture') : null,
          gradientMap: !!m.gradientMap,
          flatShading: !!m.flatShading,
          transparent: !!m.transparent,
          toneMapped: m.toneMapped,
          pbr: 'roughness' in m ? { roughness: m.roughness, metalness: m.metalness } : 'shininess' in m ? { shininess: m.shininess } : null,
          users: 0,
        }
        e.users += count
        materials.set(key, e)
      }
      const gkey = `${g.type}|${JSON.stringify(params(g))}|${mats.map((m) => m.type + hex(m.color)).join(',')}`
      const e = meshes.get(gkey) ?? {
        kind: o.isInstancedMesh ? 'InstancedMesh' : o.type,
        geometry: g.type,
        params: params(g),
        triangles: tris,
        indexed: !!g.index,
        faceted: faceted(g),
        material: mats.map((m) => `${m.type} ${hex(m.color) ?? ''}`).join(', '),
        instances: 0,
        objects: 0,
      }
      e.instances += count
      e.objects += 1
      meshes.set(gkey, e)
    })
    const lights = []
    scene.traverse((o) => {
      if (!o.isLight) return
      lights.push({
        type: o.type,
        color: hex(o.color),
        ground: o.groundColor ? hex(o.groundColor) : undefined,
        intensity: +o.intensity.toFixed(2),
        castShadow: o.castShadow,
        shadow: o.castShadow ? { mapSize: o.shadow.mapSize.x, radius: o.shadow.radius, bias: o.shadow.bias } : undefined,
      })
    })
    const TONE = { 0: 'NoToneMapping', 1: 'Linear', 2: 'Reinhard', 3: 'Cineon', 4: 'ACESFilmic', 6: 'AgX', 7: 'Neutral' }
    const SHADOW = { 0: 'Basic', 1: 'PCF', 2: 'PCFSoft', 3: 'VSM' }
    let triangles = 0
    for (const m of meshes.values()) triangles += m.triangles * m.instances
    return {
      renderer: {
        toneMapping: TONE[gl.toneMapping] ?? gl.toneMapping,
        exposure: gl.toneMappingExposure,
        outputColorSpace: gl.outputColorSpace,
        shadows: gl.shadowMap.enabled ? SHADOW[gl.shadowMap.type] : 'off',
        pixelRatio: gl.getPixelRatio(),
        drawCalls: gl.info.render.calls,
        trianglesDrawn: gl.info.render.triangles,
      },
      fog: scene.fog ? { type: scene.fog.type, color: hex(scene.fog.color), near: scene.fog.near, far: scene.fog.far } : null,
      background: scene.background ? hex(scene.background) : null,
      lights,
      materials: [...materials.values()].sort((a, b) => b.users - a.users),
      meshes: [...meshes.values()].sort((a, b) => b.triangles * b.instances - a.triangles * a.instances),
      sceneTriangles: triangles,
    }
  })
  writeFileSync(join(out, 'audit.json'), JSON.stringify(audit, null, 2))
  console.log(`audit → ${join(out, 'audit.json')}`)
}

console.log(`${files.length} captures → ${out}`)
if (errors.length) console.log('page errors:\n' + [...new Set(errors)].slice(0, 10).join('\n'))
await browser.close()
