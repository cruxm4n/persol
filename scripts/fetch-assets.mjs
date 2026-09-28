// Download the generated materials listed in assets/manifest.json into public/,
// converted to JPEG (quality 82) with sharp. Run: npm run assets
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import sharp from 'sharp'

const manifest = JSON.parse(await readFile(new URL('../assets/manifest.json', import.meta.url), 'utf8'))
for (const a of manifest.assets) {
  process.stdout.write(`${a.id}… `)
  const res = await fetch(a.url)
  if (!res.ok) {
    console.log(`échec (${res.status})`)
    continue
  }
  const buf = Buffer.from(await res.arrayBuffer())
  await mkdir(dirname(a.out), { recursive: true })
  const jpg = await sharp(buf).resize({ width: a.size, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer()
  await writeFile(a.out, jpg)
  console.log(`${a.out} (${Math.round(jpg.length / 1024)} Ko)`)
}
