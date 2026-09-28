import { chapters, identity } from '../content'
import { scrollToChapter } from '../scroll'

/** Two words and a way out. The line itself is the progress indicator. */
export function Masthead() {
  return (
    <header className="masthead">
      <a href="#lancement" onClick={(e) => (e.preventDefault(), scrollToChapter(0))}>
        {identity.name}
      </a>
      <a href="#contact" onClick={(e) => (e.preventDefault(), scrollToChapter(chapters.length - 1))}>
        Contact
      </a>
    </header>
  )
}
