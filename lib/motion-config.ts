/**
 * Motion vocabulary. Few curves, used consistently: things arrive fast and
 * settle long (expo out), the camera leaves slowly and lands softly (inOut).
 */
export const EASE = {
  arrive: 'expo.out',
  travel: 'power3.inOut',
  settle: 'power2.out',
  snap: 'power4.out',
}

export const EASE_CSS = {
  arrive: 'cubic-bezier(0.16, 1, 0.3, 1)',
  travel: 'cubic-bezier(0.65, 0, 0.35, 1)',
}

export const DURATION = {
  micro: 0.35,
  reveal: 1.1,
  loader: 1.4,
}

/** How fast the camera catches up with the scroll (higher = tighter). */
export const CAMERA_DAMPING = 3.2

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
/** Map p from [a, b] to [0, 1], clamped. */
export const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
export const smooth = (x: number) => x * x * (3 - 2 * x)
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
export const expoOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x))
