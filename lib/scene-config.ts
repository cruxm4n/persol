/**
 * The five acts of the route. Scroll is the only way forward: each act owns a
 * length of page (in viewport heights) and the camera follows a fixed path
 * through it.
 */
export type ActId = 'signal' | 'attention' | 'network' | 'system' | 'contact'

export const ACTS: { id: ActId; number: string; title: string; length: number }[] = [
  { id: 'signal', number: '01', title: 'Signal', length: 3.2 },
  { id: 'attention', number: '02', title: 'Attention', length: 1 },
  { id: 'network', number: '03', title: 'Network', length: 1 },
  { id: 'system', number: '04', title: 'System', length: 1 },
  { id: 'contact', number: '05', title: 'Contact', length: 1 },
]

/**
 * The world is a scale model on a drafting table. One unit is one centimetre
 * of model; at 1:50 a real 4 × 3 m billboard is 8 × 6 units.
 */
export const MODEL = {
  scale: 50,
  plinth: { w: 26, h: 1.2, d: 18 },
  panel: { w: 8, h: 6, depth: 0.28, border: 0.14 },
  post: { w: 0.42, h: 4.6 },
}

/** Height of the panel's centre above the table. */
export const PANEL_Y = MODEL.plinth.h + MODEL.post.h + MODEL.panel.h / 2

export const COLORS = {
  night: '#141311',
  paper: '#ece8e1',
  sheet: '#d8d3c9',
  foam: '#f1eee8',
  core: '#e2ddd2',
  metal: '#34332f',
  graphite: '#8a867e',
  ink: '#141414',
  red: '#e0301e',
  lamp: '#ffd9a8',
}
