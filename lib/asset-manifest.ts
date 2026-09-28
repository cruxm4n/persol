/**
 * Every image file the island uses, with its fallback. Generated images live
 * in public/assets/generated/<zone>/ (see public/assets/manifest.json); if one
 * is missing the scene keeps its placeholder or its surface painted in code
 * (lib/materials.ts). A missing file never blocks the render.
 */
export type AssetDefinition = {
  id: string
  generatedPath?: string
  placeholderPath: string
  role: string
}

export function getAssetPath(asset: AssetDefinition) {
  return asset.generatedPath || asset.placeholderPath
}

export const ASSETS: AssetDefinition[] = [
  { id: 'poster-a', generatedPath: 'assets/generated/attention/poster-a.webp', placeholderPath: 'assets/placeholders/poster.svg', role: 'Affiche abstraite, rue des affiches' },
  { id: 'poster-b', generatedPath: 'assets/generated/attention/poster-b.webp', placeholderPath: 'assets/placeholders/poster.svg', role: 'Affiche abstraite, rue des affiches et chevalet du studio' },
  { id: 'poster-c', generatedPath: 'assets/generated/attention/poster-c.webp', placeholderPath: 'assets/placeholders/poster.svg', role: 'Affiche de la colonne' },
  { id: 'concept', generatedPath: 'assets/generated/arrival/concept.webp', placeholderPath: 'assets/placeholders/project.svg', role: 'Image de partage et page sans WebGL' },
]

export const assetPath = (id: string) => getAssetPath(ASSETS.find((a) => a.id === id)!)

/** Load an image if it exists; resolve to null otherwise (the caller keeps its placeholder). */
export function loadImage(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}
