/** One figure and what it counts. Figures come only from the source content. */
export function DataPoint({ value, label, show }: { value: string; label: string; show: boolean }) {
  return (
    <div className={`datapoint ${show ? 'is-shown' : ''}`}>
      <span className="datapoint-value">{value}</span>
      <span className="datapoint-label">{label}</span>
    </div>
  )
}
