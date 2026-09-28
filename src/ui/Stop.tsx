import type { ReactNode } from 'react'
import { SHOW_GAPS, brandsOf, stops, type Project, type Stop } from '../lib/portfolio-data'
import { scrollToChapter } from '../scroll'
import { setUi, useUi } from '../store'

/** An empty field: visible while the content is being gathered, hidden at launch. */
function Gap({ children = 'À compléter' }: { children?: ReactNode }) {
  return SHOW_GAPS ? <span className="gap">{children}</span> : null
}

function Brands({ project }: { project: Project }) {
  const list = brandsOf(project)
  if (list.length) return <>{list.map((b) => b.name).join(' · ')}</>
  return (
    <Gap>
      À attribuer —{' '}
      <button type="button" className="gap-link" onClick={() => setUi({ indexOpen: true })}>
        voir l'Index
      </button>
    </Gap>
  )
}

function List({ items }: { items: string[] }) {
  return items.length ? <>{items.join(', ')}</> : <Gap />
}

/** The main case study: an editorial sheet pinned while the scene tells its steps. */
function CaseStudy({ project, stopIndex, note }: { project: Project; stopIndex: number; note?: string }) {
  const phase = useUi((s) => (s.project === project.id ? s.phase : -1))
  const hasResult = !!project.metrics?.length
  return (
    <div
      className="case-track"
      data-case-track={stopIndex}
      data-steps={Math.max(1, project.role.length)}
      id={project.id}
      data-project={project.id}
    >
      <article className="case" aria-labelledby={`${project.id}-title`}>
        <p className="case-line">
          <span className="case-no">{project.number}</span>
          <span className="case-rule" aria-hidden="true" />
          <span>{project.category}</span>
          <span className="case-year">{project.year ?? <Gap>Année</Gap>}</span>
        </p>
        <h3 id={`${project.id}-title`} className="case-title">
          {project.title}
        </h3>
        {project.draft && SHOW_GAPS && (
          <p className="case-draft">Fiche type : la mission est réelle, la campagne précise reste à renseigner.</p>
        )}
        <p className="case-context">{project.context || <Gap>Contexte à compléter.</Gap>}</p>

        <dl className="case-meta">
          <div>
            <dt>Rôle</dt>
            <dd>
              {project.role.length ? (
                <ol className="case-steps">
                  {project.role.map((r, i) => (
                    <li key={r} className={i === phase ? 'is-now' : i < phase ? 'is-done' : ''}>
                      <span className="case-step-no">{String(i + 1).padStart(2, '0')}</span>
                      {r}
                    </li>
                  ))}
                </ol>
              ) : (
                <Gap />
              )}
            </dd>
          </div>
          <div>
            <dt>Livrables</dt>
            <dd>
              <List items={project.deliverables} />
            </dd>
          </div>
          <div>
            <dt>Marques</dt>
            <dd>
              <Brands project={project} />
            </dd>
          </div>
        </dl>

        <div className="case-result">
          <p className="case-label">Résultat</p>
          {hasResult ? (
            <dl className="case-metrics">
              {project.metrics!.map((m) => (
                <div key={m.label}>
                  <dt>{m.label}</dt>
                  <dd>{m.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="case-noresult">
              <Gap>Aucun chiffre publié pour ce projet.</Gap>
            </p>
          )}
        </div>
        {note && <p className="case-schema">{note}</p>}
        {project.link && (
          <a className="case-more" href={project.link} target="_blank" rel="noreferrer">
            Voir le détail
          </a>
        )}
      </article>
    </div>
  )
}

function Secondary({ project }: { project: Project }) {
  return (
    <li className="minor" id={project.id} data-project={project.id}>
      <span className="minor-no">{project.number}</span>
      <h3 className="minor-title">{project.title}</h3>
      <p className="minor-meta">
        <span>{project.category}</span>
        <span>
          <Brands project={project} />
        </span>
        <span>{project.role.length ? project.role.join(', ') : <Gap>Rôle à compléter</Gap>}</span>
      </p>
    </li>
  )
}

/**
 * One stop of the route: a strong entry, one main case study, two or three
 * secondary ones, and an exit that hands over to the next stop.
 */
export function StopSection({ stop, chapter, next }: { stop: Stop; chapter: number; next?: { label: string; chapter: number; id: string } }) {
  const index = stops.indexOf(stop)
  const [main, ...rest] = stop.projects
  const [first, ...words] = stop.title.split(' ')
  return (
    <section
      id={stop.id}
      data-chapter={chapter}
      data-stop={index}
      className={`stop stop--${index % 2 ? 'right' : 'left'}`}
      aria-labelledby={`${stop.id}-title`}
    >
      <header className="stop-entry">
        <p className="stop-label">
          Stop {stop.number}
          <span> / {String(stops.length).padStart(2, '0')}</span>
        </p>
        <h2 id={`${stop.id}-title`} className="stop-title">
          <span className="stop-no" aria-hidden="true">
            {stop.number}
          </span>
          <span className="stop-words">
            <span>{first}</span> <span>{words.join(' ')}</span>
          </span>
        </h2>
        <p className="stop-sub">{stop.subtitle}</p>
        <p className="stop-intro">{stop.description}</p>
        {stop.tools && (
          <p className="stop-tools">
            <span className="case-label">Outils</span>
            {stop.tools.join(', ')}
          </p>
        )}
      </header>

      <CaseStudy project={main} stopIndex={index} note={stop.sceneNote} />

      {rest.length > 0 && (
        <div className="minors">
          <p className="case-label">Aussi dans ce stop</p>
          <ol>
            {rest.map((p) => (
              <Secondary key={p.id} project={p} />
            ))}
          </ol>
        </div>
      )}

      {next && (
        <footer className="stop-exit">
          <span className="case-label">À suivre</span>
          <a href={`#${next.id}`} onClick={(e) => (e.preventDefault(), scrollToChapter(next.chapter))}>
            {next.label}
          </a>
        </footer>
      )}
    </section>
  )
}
