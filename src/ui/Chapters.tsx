import { useState } from 'react'
import { contact, hero, identity, journey, profile, stats } from '../content'
import { SHOW_GAPS, brands, stops } from '../lib/portfolio-data'
import { scrollToChapter } from '../scroll'
import { StopSection } from './Stop'
import { BrandWall } from './BrandWall'

/** Chapter order: hero, brands, profile, the stops, parcours, contact. */
const BRANDS = 1
const PROFILE = 2
const STOP_CHAPTER = 3
const PARCOURS = STOP_CHAPTER + stops.length
const CONTACT = PARCOURS + 1

function Intro() {
  return (
    <section id="lancement" data-chapter={0} className="hero" aria-labelledby="lancement-title">
      <p className="hero-role">
        {identity.role}
        <span className="hero-since">depuis {identity.since}</span>
      </p>
      <h1 id="lancement-title" className="hero-name">
        <span>Louis</span> <span className="hero-initial">R.</span>
      </h1>
      <p className="hero-lede">{hero.lede}</p>
      <p className="hero-brands">{hero.brands}</p>
      <div className="hero-foot">
        {identity.available && <p>Disponible pour de nouvelles missions.</p>}
        <a href="#marques" onClick={(e) => (e.preventDefault(), scrollToChapter(BRANDS))}>
          Voir les {brands.length} marques
        </a>
      </div>
    </section>
  )
}

function Profile() {
  return (
    <section id="profil" data-chapter={PROFILE} className="profile" aria-labelledby="profil-title">
      <p className="section-label">Profil</p>
      <h2 id="profil-title" className="profile-title">
        {profile.title}
      </h2>
      <p className="profile-lead">{profile.lead}</p>
      <p className="profile-body">{profile.body}</p>
      <nav className="route" aria-labelledby="route-title">
        <p id="route-title" className="route-intro">
          {profile.routeIntro}
        </p>
        <ol>
          {stops.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} onClick={(e) => (e.preventDefault(), scrollToChapter(STOP_CHAPTER + i))}>
                <span className="route-no">{s.number}</span>
                <span className="route-title">{s.title}</span>
                <span className="route-sub">{s.subtitle}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  )
}

function Journey() {
  return (
    <section id="parcours" data-chapter={PARCOURS} className="journey" aria-labelledby="parcours-title">
      <p className="section-label">Parcours</p>
      <h2 id="parcours-title" className="journey-title" aria-label="De 2018 à aujourd'hui">
        <span>2018</span>
        <span>aujourd'hui</span>
      </h2>
      <dl className="ledger">
        {stats.map((s) => (
          <div key={s.label}>
            <dt>
              {s.label}
              {s.note && SHOW_GAPS && <span className="gap">{s.note}</span>}
            </dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
      <p className="ledger-note">Chiffres cumulés sur l'ensemble du parcours, sans rattachement à un projet précis.</p>
      <ol className="milestones">
        {journey.map((j, i) => (
          <li key={j.title} className={i === journey.length - 1 ? 'is-now' : ''}>
            <span className="milestone-at">{j.at}</span>
            <h3>{j.title}</h3>
            <p>{j.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

const hasEmail = !contact.email.endsWith('@example.com')
const hasLinkedin = contact.linkedin.url !== '#'

function Contact() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.email)
      setCopied(true)
    } catch {
      window.getSelection()?.selectAllChildren(document.getElementById('contact-email')!)
    }
  }

  return (
    <section id="contact" data-chapter={CONTACT} className="contact" aria-labelledby="contact-title">
      <p className="section-label">Contact</p>
      <h2 id="contact-title" className="contact-title">
        {contact.title}
      </h2>
      <p className="contact-text">{contact.text}</p>
      <dl className="contact-lines">
        <div>
          <dt>E-mail</dt>
          <dd>
            {hasEmail ? (
              <>
                <a id="contact-email" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
                <button type="button" className="contact-copy" onClick={copy}>
                  {copied ? 'Adresse copiée' : "Copier l'adresse"}
                </button>
              </>
            ) : (
              SHOW_GAPS && <span className="gap">Adresse à renseigner</span>
            )}
          </dd>
        </div>
        <div>
          <dt>LinkedIn</dt>
          <dd>
            {hasLinkedin ? (
              <a href={contact.linkedin.url} target="_blank" rel="noreferrer">
                {contact.linkedin.label}
              </a>
            ) : (
              SHOW_GAPS && <span className="gap">Lien à renseigner</span>
            )}
          </dd>
        </div>
      </dl>
      <p className="footnote">
        © {new Date().getFullYear()} {identity.name}, {identity.role}
      </p>
    </section>
  )
}

export function Chapters() {
  return (
    <main className="story">
      <Intro />
      <BrandWall chapter={BRANDS} />
      <Profile />
      {stops.map((s, i) => {
        const next = stops[i + 1]
        return (
          <StopSection
            key={s.id}
            stop={s}
            chapter={STOP_CHAPTER + i}
            next={
              next
                ? { label: `Stop ${next.number} — ${next.title}`, chapter: STOP_CHAPTER + i + 1, id: next.id }
                : { label: 'Le parcours depuis 2018', chapter: PARCOURS, id: 'parcours' }
            }
          />
        )
      })}
      <Journey />
      <Contact />
    </main>
  )
}
