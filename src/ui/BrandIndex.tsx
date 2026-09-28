import { useEffect, useMemo, useRef, useState } from 'react'
import { brandIndex, brands, stops, type IndexRow } from '../lib/portfolio-data'
import { pauseScroll, scrollToElement } from '../scroll'
import { setUi, useUi } from '../store'

type Filter = 'all' | 'none' | string
type Sort = 'brand' | 'stop'

/**
 * Every brand, findable without interrupting the route. A compact typographic
 * table in a side panel; each row leads to the project the brand belongs to.
 */
export function BrandIndex() {
  const open = useUi((s) => s.indexOpen)
  const ref = useRef<HTMLDialogElement>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('brand')
  const rows = useMemo(brandIndex, [])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
    pauseScroll(open)
  }, [open])

  // #index opens the panel, so it can be linked to directly
  useEffect(() => {
    const check = () => location.hash === '#index' && setUi({ indexOpen: true })
    check()
    window.addEventListener('hashchange', check)
    return () => window.removeEventListener('hashchange', check)
  }, [])

  const matches = (r: IndexRow, f: Filter) => (f === 'all' ? true : f === 'none' ? !r.stop : r.stop?.id === f)
  const visible = rows
    .filter((r) => matches(r, filter))
    .sort((a, b) =>
      sort === 'stop'
        ? (a.stop?.number ?? '99').localeCompare(b.stop?.number ?? '99') || a.brand.name.localeCompare(b.brand.name, 'fr')
        : a.brand.name.localeCompare(b.brand.name, 'fr'),
    )
  const count = (f: Filter) => new Set(rows.filter((r) => matches(r, f)).map((r) => r.brand.id)).size

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Toutes' },
    ...stops.map((s) => ({ id: s.id, label: `${s.number} ${s.title}` })),
    { id: 'none', label: 'Non attribuées' },
  ]

  const go = (r: IndexRow) => {
    const el = r.project && document.getElementById(r.project.id)
    setUi({ indexOpen: false })
    if (el) requestAnimationFrame(() => scrollToElement(el))
  }

  return (
    <dialog
      ref={ref}
      className="index"
      aria-labelledby="index-title"
      onClose={() => setUi({ indexOpen: false })}
      onClick={(e) => e.target === e.currentTarget && setUi({ indexOpen: false })}
    >
      <div className="index-sheet">
        <header className="index-head">
          <h2 id="index-title">
            Index <span className="index-total">{brands.length}</span>
          </h2>
          <button type="button" className="index-close" onClick={() => setUi({ indexOpen: false })}>
            Fermer
          </button>
          <p>Toutes les marques, rangées par projet. Une marque sans projet attend sa fiche : rien n'est classé au hasard.</p>
        </header>

        <div className="index-filters" role="group" aria-label="Filtrer par stop">
          {filters.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
              <span className="index-n">{count(f.id)}</span>
            </button>
          ))}
        </div>

        <table className="index-table">
          <thead>
            <tr>
              <th scope="col" aria-sort={sort === 'brand' ? 'ascending' : 'none'}>
                <button type="button" onClick={() => setSort('brand')}>
                  Marque
                </button>
              </th>
              <th scope="col" aria-sort={sort === 'stop' ? 'ascending' : 'none'}>
                <button type="button" onClick={() => setSort('stop')}>
                  Stop
                </button>
              </th>
              <th scope="col">Projet</th>
              <th scope="col">Année</th>
              <th scope="col">Catégorie</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={`${r.brand.id}-${r.project?.id ?? 'none'}`}>
                <th scope="row">{r.brand.url ? <a href={r.brand.url}>{r.brand.name}</a> : r.brand.name}</th>
                <td className="index-mono">{r.stop ? `${r.stop.number} ${r.stop.title}` : '—'}</td>
                <td>
                  {r.project ? (
                    <button type="button" className="index-go" onClick={() => go(r)}>
                      {r.project.title}
                    </button>
                  ) : (
                    <span className="index-none">Non attribuée</span>
                  )}
                </td>
                <td className="index-mono">{r.project?.year ?? '—'}</td>
                <td>{r.brand.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <p className="index-empty">Aucune marque dans ce stop pour l'instant.</p>}
      </div>
    </dialog>
  )
}
