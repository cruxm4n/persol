import gsap from 'gsap'
import { experience } from '@/lib/experience-store'

/**
 * The opening sequence, the one moment that plays on its own:
 * darkness, three lamps catching one after the other, the poster lit,
 * then the room's light rising slowly while the camera settles.
 * The world reads these values every frame.
 */
export const lights = {
  lamps: [0, 0, 0],
  key: 0,
  ambient: 0,
  beacon: 0,
}

/** A fluorescent tube's start: a catch, a drop, then on. */
function catchOn(tl: gsap.core.Timeline, target: number[], i: number, at: number) {
  tl.to(target, { [i]: 0.55, duration: 0.04, ease: 'none' }, at)
    .to(target, { [i]: 0.08, duration: 0.07, ease: 'none' }, at + 0.05)
    .to(target, { [i]: 0.8, duration: 0.03, ease: 'none' }, at + 0.16)
    .to(target, { [i]: 0.3, duration: 0.05, ease: 'none' }, at + 0.2)
    .to(target, { [i]: 1, duration: 0.25, ease: 'power2.out' }, at + 0.27)
}

export function playIntro(onDone: () => void) {
  if (experience.reducedMotion) {
    lights.lamps = [1, 1, 1]
    lights.key = 1
    lights.ambient = 1
    lights.beacon = 1
    experience.intro = 1
    onDone()
    return
  }
  const tl = gsap.timeline({ onComplete: onDone })
  tl.to(lights, { ambient: 0.25, duration: 0.8, ease: 'sine.inOut' }, 0)
  catchOn(tl, lights.lamps, 0, 0.55)
  catchOn(tl, lights.lamps, 1, 0.95)
  catchOn(tl, lights.lamps, 2, 1.25)
  tl.to(lights, { key: 1, ambient: 1, duration: 2.2, ease: 'power2.inOut' }, 1.7)
  tl.to(experience, { intro: 1, duration: 3.6, ease: 'expo.out' }, 1.2)
  tl.to(lights, { beacon: 1, duration: 0.01 }, 2.6)
}
