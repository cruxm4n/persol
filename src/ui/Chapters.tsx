import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  brandOrder,
  brandSectors,
  brandsNote,
  chapters,
  contact,
  expertises,
  hero,
  identity,
  journey,
  profile,
  projects,
  stack,
  stats,
} from '../content'
import { scrollToChapter } from '../scroll'
import { setUi, useUi } from '../store'

function Chapter({
  index,
  tall,
  align = 'left',
  children,
}: {
  index: number
  tall?: boolean
  align?: 'left' | 'right'
  children: ReactNode
}) {
  const active = useUi((s) => s.active === index)
  const c = chapters[index]
  return (
    <section
      id={c.id}
      data-chapter={index}
      className={`chapter ${tall ? 'chapter--tall' : ''} ${active ? 'is-active' : ''}`}
      aria-labelledby={`${c.id}-title`}
    >
      <div className={`panel panel--${align}`}>
        <p className="kicker">
          <span className="kicker-code">{c.code}</span>
          <span className="kicker-rule" />
          <span>{c.label}</span>
        </p>
        {children}
      </div>
    </section>
  )
}

function Intro() {
  return (
    <section id="lancement" data-chapter={0} className="hero" aria-labelledby="lancement-title">
      <p className="hero-role">
        {identity.role}
        <span className="hero-since">depuis {identity.since}</span>
      </p>
      <h1 id="lancement-title" className="hero-name">
        <span>Louis</span>
        <span className="hero-initial">R.</span>
      </h1>
      <p className="hero-lede">{hero.lede}</p>
      <p className="hero-brands">{hero.brands}</p>
      <div className="hero-foot">
        {identity.available && <p>Disponible pour de nouvelles missions.</p>}
        <a href="#profil" onClick={(e) => (e.preventDefault(), scrollToChapter(1))}>
          Suivre la ligne depuis {identity.since}
        </a>
      </div>
    </section>
  )
}

function Profile() {
  return (
    <Chapter index={1}>
      <h2 id="profil-title" className="title">
        {profile.title}
      </h2>
      <p className="lead">{profile.lead}</p>
      <p className="body">{profile.body}</p>
      <ul className="tags" aria-label="Domaines">
        {profile.pillars.map((p) => (
          <li key={p.id}>{p.label}</li>
        ))}
      </ul>
    </Chapter>
  )
}

function Brands() {
  const hover = useUi((s) => s.hoverBrand)
  const current = useUi((s) => s.currentBrand)
  const sectorLabel = (id: string) => brandSectors.find((s) => s.id === id)?.label ?? ''
  return (
    <section id="marques" data-chapter={2} className="brands" aria-labelledby="marques-title">
      <div className="brands-head">
        <h2 id="marques-title" className="brands-count">
          {brandOrder.length}
          <span>marques</span>
        </h2>
        <p className="brands-text">{brandsNote}</p>
        <p className="brands-note">
          Classées par ordre alphabétique. Sur la ligne, leur position n'est pas une date.
        </p>
      </div>
      <ol className="brand-index">
        {brandOrder.map((b, i) => {
          const on = hover ? hover === b.name : current === i
          return (
            <li
              key={b.name}
              data-brand-row={i}
              className={on ? 'is-current' : ''}
              onPointerEnter={() => setUi({ hoverBrand: b.name })}
              onPointerLeave={() => setUi({ hoverBrand: null })}
            >
              <span className="brand-no">{String(i + 1).padStart(2, '0')}</span>
              <span className="brand-name">{b.name}</span>
              <span className="brand-sector">{sectorLabel(b.sector)}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function Missions() {
  const focus = useUi((s) => s.focusProject)
  const active = useUi((s) => s.active)
  useEffect(() => {
    if (active !== 3 && focus !== null) setUi({ focusProject: null })
  }, [active, focus])

  return (
    <Chapter index={3}>
      <h2 id="projets-title" className="title">
        Missions &amp; campagnes.
      </h2>
      <p className="body">Sélectionnez un dossier : l'écran correspondant s'allume sur le terrain.</p>
      <ol className="dossiers">
        {projects.map((p, i) => {
          const open = focus === i
          return (
            <li key={p.id} className={open ? 'is-open' : ''}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`dossier-${p.id}`}
                onClick={() => setUi({ focusProject: open ? null : i })}
              >
                <span className="dossier-id">{p.id}</span>
                <span className="dossier-title">{p.title}</span>
                <span className="dossier-role">{p.role}</span>
              </button>
              <div id={`dossier-${p.id}`} className="dossier-body" hidden={!open}>
                <p>{p.summary}</p>
                <dl>
                  {p.client && (
                    <>
                      <dt>Client</dt>
                      <dd>{p.client}</dd>
                    </>
                  )}
                  <dt>Rôle</dt>
                  <dd>{p.role}</dd>
                  <dt>Leviers</dt>
                  <dd>{p.channels.join(' · ')}</dd>
                  <dt>Résultat</dt>
                  <dd className={p.result ? 'result' : ''}>
                    {p.result ? `${p.result.value} — ${p.result.label}` : 'Étude de cas détaillée sur demande'}
                  </dd>
                </dl>
              </div>
            </li>
          )
        })}
      </ol>
    </Chapter>
  )
}

function Expertises() {
  return (
    <Chapter index={4}>
      <h2 id="expertises-title" className="title">
        Quatre disciplines, un seul plan de vol.
      </h2>
      <ol className="expertises">
        {expertises.map((e) => (
          <li key={e.id}>
            <span className="meta">{e.id}</span>
            <div>
              <h3>{e.title}</h3>
              <p>{e.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </Chapter>
  )
}

function Stack() {
  return (
    <Chapter index={5}>
      <h2 id="stack-title" className="title">
        Instruments de bord.
      </h2>
      <p className="body">Les outils avec lesquels je mesure, crée et automatise.</p>
      <div className="stack">
        {stack.map((s) => (
          <div key={s.id}>
            <h3 className="meta">{s.label}</h3>
            <ul>
              {s.tools.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Chapter>
  )
}

function Results() {
  return (
    <Chapter index={6}>
      <h2 id="resultats-title" className="title">
        Ce que la piste retient.
      </h2>
      <dl className="stats">
        {stats.map((s) => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
    </Chapter>
  )
}

function Journey() {
  return (
    <Chapter index={7}>
      <h2 id="parcours-title" className="title">
        Parcours.
      </h2>
      <ol className="journey">
        {journey.map((j) => (
          <li key={j.title}>
            <span className="meta">{j.at}</span>
            <h3>{j.title}</h3>
            <p>{j.text}</p>
          </li>
        ))}
      </ol>
    </Chapter>
  )
}

function Contact() {
  const [sent, setSent] = useState(false)
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const subject = encodeURIComponent(`Projet — ${data.get('name') ?? ''}`)
    const body = encodeURIComponent(`${data.get('message') ?? ''}\n\n${data.get('name') ?? ''} · ${data.get('email') ?? ''}`)
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <Chapter index={8}>
      <h2 id="contact-title" className="title">
        {contact.title}.
      </h2>
      <p className="lead">{contact.text}</p>
      <ul className="channels">
        <li>
          <span className="meta">Email</span>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </li>
        <li>
          <span className="meta">LinkedIn</span>
          <a href={contact.linkedin.url} target="_blank" rel="noreferrer">
            {contact.linkedin.label}
          </a>
        </li>
      </ul>
      <form className="form" onSubmit={onSubmit}>
        <label>
          <span className="meta">Nom</span>
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          <span className="meta">Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label className="form-wide">
          <span className="meta">Message</span>
          <textarea name="message" rows={2} required />
        </label>
        <button type="submit" className="launch launch--small">
          <span className="launch-ring" aria-hidden="true" />
          <span>{sent ? 'Message prêt dans votre messagerie' : 'Envoyer le message'}</span>
        </button>
      </form>
      <p className="footnote">
        © {new Date().getFullYear()} {identity.name} — {identity.role}
      </p>
    </Chapter>
  )
}

export function Chapters() {
  return (
    <main className="story">
      <Intro />
      <Profile />
      <Brands />
      <Missions />
      <Expertises />
      <Stack />
      <Results />
      <Journey />
      <Contact />
    </main>
  )
}
