import * as THREE from 'three'

/**
 * Annotations are HTML (crisp type, accessible) pinned to points of the model.
 * Each frame the world projects every registered point and moves its element;
 * the element's own opacity is left to the page.
 */
type Anchor = { el: HTMLElement; point: THREE.Vector3 }

const anchors = new Map<string, Anchor>()

export function registerAnchor(id: string, el: HTMLElement, point: [number, number, number]) {
  anchors.set(id, { el, point: new THREE.Vector3(...point) })
  return () => {
    anchors.delete(id)
  }
}

const v = new THREE.Vector3()

export function projectAnchors(camera: THREE.Camera, width: number, height: number) {
  anchors.forEach(({ el, point }) => {
    v.copy(point).project(camera)
    const behind = v.z > 1
    const x = (v.x * 0.5 + 0.5) * width
    const y = (-v.y * 0.5 + 0.5) * height
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
    el.style.visibility = behind ? 'hidden' : ''
  })
}
