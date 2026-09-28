/** Index, rule, name: how every act and annotation introduces itself. */
export function EditorialLabel({ index, children, className = '' }: { index: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={`label ${className}`}>
      <span className="label-index">{index}</span>
      <span className="label-rule" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}
