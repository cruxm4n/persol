/**
 * The walk, as camera keys along the route's progress (0..1).
 *
 * Every place has two keys close together, an arrival and a departure: the
 * camera eases into the first, drifts slowly to the second while the words
 * are read, then leaves faster for the next place. Coordinates follow the
 * island layout in scene-config.ts.
 *
 * Portrait screens walk their own path: closer, centred on each place, wider
 * lens, because the frame is narrow and tall.
 */
export type CameraKey = {
  p: number
  pos: [number, number, number]
  target: [number, number, number]
  fov: number
  /** depth-of-field (tilt-shift) strength: 0 none, 1 miniature */
  blur: number
}

export const DESKTOP_PATH: CameraKey[] = [
  // arrival: from high over the sea, the whole island in morning light
  { p: 0, pos: [10, 46, 84], target: [0, 0, -2], fov: 32, blur: 0.9 },
  // down to the dock, the boat and the lighthouse
  { p: 0.075, pos: [17, 9.5, 48], target: [3, 2, 26], fov: 36, blur: 0.3 },
  { p: 0.11, pos: [15, 9, 45.5], target: [1.5, 2, 24.5], fov: 36, blur: 0.3 },
  // the studio, its sign: 2018
  { p: 0.17, pos: [0.5, 5.2, 24], target: [-11, 2.6, 11.5], fov: 36, blur: 0.25 },
  { p: 0.255, pos: [-1.5, 4.8, 22], target: [-11.5, 2.4, 11], fov: 36, blur: 0.25 },
  // the poster street: +200 campaigns, +100 budget
  { p: 0.33, pos: [-3, 6, 13], target: [9.5, 2.6, 1.5], fov: 38, blur: 0.25 },
  { p: 0.43, pos: [-3.5, 5.6, 10], target: [9.5, 2.5, 0], fov: 38, blur: 0.25 },
  // the village, seen from above so the network reads: +500 clients
  { p: 0.51, pos: [5, 15, 2], target: [-10, 1, -11], fov: 38, blur: 0.45 },
  { p: 0.61, pos: [4, 14, -1], target: [-10.5, 1, -12], fov: 38, blur: 0.45 },
  // the workshop: the stack
  { p: 0.69, pos: [-2, 7.5, -6], target: [8.5, 2.2, -18], fov: 38, blur: 0.3 },
  { p: 0.79, pos: [-2.5, 7, -9.5], target: [8.5, 2, -19], fov: 38, blur: 0.3 },
  // on to the quay, the sun going down
  { p: 0.88, pos: [-4, 4.2, -22], target: [0, 2, -32], fov: 40, blur: 0.2 },
  { p: 1, pos: [0.5, 3.2, -25], target: [0, 4.2, -80], fov: 42, blur: 0.15 },
]

export const PORTRAIT_PATH: CameraKey[] = [
  { p: 0, pos: [6, 62, 70], target: [0, 0, -2], fov: 46, blur: 0.6 },
  { p: 0.075, pos: [12, 10, 50], target: [3, 2, 26], fov: 54, blur: 0.2 },
  { p: 0.11, pos: [11, 9.5, 47.5], target: [1.5, 2, 24.5], fov: 54, blur: 0.2 },
  { p: 0.17, pos: [-5, 5.5, 23], target: [-11, 2.8, 11.5], fov: 56, blur: 0.2 },
  { p: 0.255, pos: [-6, 5, 21], target: [-11.5, 2.6, 11], fov: 56, blur: 0.2 },
  { p: 0.33, pos: [-1, 6.5, 10], target: [9.5, 2.8, 1.5], fov: 58, blur: 0.2 },
  { p: 0.43, pos: [-1, 6, 8], target: [9.5, 2.6, 0], fov: 58, blur: 0.2 },
  { p: 0.51, pos: [-3, 17, -1], target: [-10, 1, -11], fov: 56, blur: 0.3 },
  { p: 0.61, pos: [-4, 16, -3], target: [-10.5, 1, -12], fov: 56, blur: 0.3 },
  { p: 0.69, pos: [-1, 8, -7], target: [8.5, 2.2, -18], fov: 58, blur: 0.2 },
  { p: 0.79, pos: [-1.5, 7.5, -10], target: [8.5, 2, -19], fov: 58, blur: 0.2 },
  { p: 0.88, pos: [-2, 4.6, -21], target: [0, 2.2, -32], fov: 58, blur: 0.15 },
  { p: 1, pos: [0.5, 3.4, -24], target: [0, 5, -80], fov: 60, blur: 0.1 },
]
