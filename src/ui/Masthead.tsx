import { chapters, identity } from '../content'
import { brands } from '../lib/portfolio-data'
import { scrollToChapter } from '../scroll'
import { setUi } from '../store'

/** Name, the brand index, and a way out. The line itself is the progress indicator. */
export function Masthead() {
  return (
    <header className="masthead">
      <a href="#lancement" onClick={(e) => (e.preventDefault(), scrollToChapter(0))}>
        {identity.name}
      </a>
      <nav className="masthead-nav" aria-label="Accès">
        <button type="button" onClick={() => setUi({ indexOpen: true })} aria-haspopup="dialog">
          Index <span className="masthead-n">{brands.length}</span>
        </button>
        <a href="#contact" onClick={(e) => (e.preventDefault(), scrollToChapter(chapters.length - 1))}>
          Contact
        </a>
      </nav>
    </header>
  )
}
