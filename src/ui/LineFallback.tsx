import { stops } from '../lib/portfolio-data'
import { STOP_U, curve, milestones, yearAt, years } from '../world/line'

/**
 * Static plan view of the career line, drawn from the same data, for browsers
 * without WebGL: years as graduations, the three stops as stations, today in red.
 */
export function LineFallback() {
  const pts = curve.getSpacedPoints(200)
  const xs = pts.map((p) => p.x)
  const zs = pts.map((p) => p.z)
  const minX = Math.min(...xs) - 20
  const maxX = Math.max(...xs) + 20
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)
  // plan view: time runs left → right
  const X = (z: number) => ((maxZ - z) / (maxZ - minZ)) * 1000
  const Y = (x: number) => ((x - minX) / (maxX - minX)) * 260 + 20
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.z).toFixed(1)} ${Y(p.x).toFixed(1)}`).join(' ')
  const end = pts[pts.length - 1]

  return (
    <div className="world world--fallback" aria-hidden="true">
      <svg viewBox="-40 0 1080 320" preserveAspectRatio="xMidYMid meet">
        {years.map((y) => {
          const p = curve.getPointAt(Math.min(1, yearAt(y)))
          return (
            <g key={y}>
              <line x1={X(p.z)} x2={X(p.z)} y1={8} y2={312} className="fb-tick" />
              <text x={X(p.z) + 4} y={306} className="fb-year">
                {y}
              </text>
            </g>
          )
        })}
        <path d={d} className="fb-line" />
        {milestones.slice(1, -1).map((m) => {
          const p = curve.getPointAt(m.u)
          return <circle key={m.title} cx={X(p.z)} cy={Y(p.x)} r={3} className="fb-dot" />
        })}
        {stops.map((s, i) => {
          const p = curve.getPointAt(STOP_U[i])
          const x = X(p.z)
          const y = Y(p.x)
          return (
            <g key={s.id}>
              <rect x={x - 5} y={y - 5} width={10} height={10} className="fb-stop" />
              <text x={x + 9} y={y - 9} className="fb-year">
                {`${s.number} ${s.title}`}
              </text>
            </g>
          )
        })}
        <circle cx={X(end.z)} cy={Y(end.x)} r={6} className="fb-now" />
      </svg>
    </div>
  )
}
