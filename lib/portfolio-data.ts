/**
 * Everything the portfolio says, in one place.
 *
 * Source: louisr.lovable.app and the public tables it reads (translations,
 * clients, categories, stack_tools, site_settings), checked on 2026-09-28.
 * Texts are the source's own, word for word.
 *
 * Rule: nothing is invented. The source's « Projets & Réalisations » holds
 * only test entries, so no project is shown; its e-mail and LinkedIn are
 * placeholders, so they stay empty here (SHOW_GAPS decides how that reads).
 */

export type Brand = {
  id: string
  name: string
  /** sector, as filed in the source */
  category: string
}

/**
 * Show « À compléter » where a field is empty. Set to false at launch:
 * empty fields are then simply left out.
 */
export const SHOW_GAPS = true

export const identity = {
  name: 'Louis R.',
  initials: 'LR',
  role: 'Digital Marketing Manager',
  available: true,
  description:
    'Spécialiste du marketing digital et de la stratégie numérique. Je transforme vos ambitions en campagnes performantes et mémorables.',
}

/** « Chiffres clés », with the source's own labels. */
export const stats = {
  campaigns: { value: '+200', label: 'Campagnes' },
  clients: { value: '+500', label: 'Clients' },
  // TODO : unité du budget géré (ex. « +100 k€ ») — absente de la source
  budget: { value: '+100', label: 'Budget géré' },
  since: { value: '2018', label: 'Années d’exp.' },
}

/** « Expertise » */
export const expertises = [
  {
    id: 'influence',
    title: 'Influence Marketing Manager',
    text: "Stratégie et activation de campagnes avec des créateurs de contenu pour maximiser l'engagement et la notoriété de marque.",
  },
  {
    id: 'digital',
    title: 'Digital Marketing',
    text: 'Pilotage de campagnes multi-canal (SEO, SEA, Social Ads) avec un focus ROI et acquisition mesurable.',
  },
  {
    id: 'project',
    title: 'Project Management',
    text: "Coordination d'équipes et gestion de projets complexes de la stratégie à l'exécution et au reporting.",
  },
  {
    id: 'content',
    title: 'Content & Production Management',
    text: 'Direction créative et production de contenus engageants pour plateformes sociales et campagnes digitales.',
  },
]

/** « Ils m'ont fait confiance » */
export const clientsSection = {
  title: 'Ils m’ont fait confiance',
  note: 'Missions réalisées en direct ou via agence',
}

export const brands: Brand[] = [
  { id: 'orange', name: 'Orange', category: 'Télécom / Tech' },
  { id: 'samsung', name: 'Samsung', category: 'Télécom / Tech' },
  { id: 'asus', name: 'Asus', category: 'Télécom / Tech' },
  { id: 'lenovo', name: 'Lenovo', category: 'Télécom / Tech' },
  { id: 'hp', name: 'HP', category: 'Télécom / Tech' },
  { id: 'xiaomi', name: 'Xiaomi', category: 'Télécom / Tech' },
  { id: 'poco', name: 'Poco', category: 'Télécom / Tech' },
  { id: 'asus-rog', name: 'ASUS ROG', category: 'Gaming' },
  { id: 'cooler-master', name: 'Cooler Master', category: 'Gaming' },
  { id: 'omen', name: 'OMEN by HP', category: 'Gaming' },
  { id: 'nintendo', name: 'Nintendo', category: 'Gaming' },
  { id: 'netflix', name: 'Netflix', category: 'Streaming' },
  { id: 'prime-video', name: 'Prime Video', category: 'Streaming' },
  { id: 'red-bull', name: 'Red Bull', category: 'Food & Beverage' },
  { id: 'nike', name: 'Nike', category: 'Lifestyle' },
]

export const categories = [...new Set(brands.map((b) => b.category))]

/** « Stack technique » */
export const tools: { group: string; items: string[] }[] = [
  { group: 'Marketing', items: ['Google Ads', 'Meta Ads', 'SEO / SEA', 'Emailing', 'CRM', 'Growth'] },
  { group: 'Analytics', items: ['Google Analytics', 'Tag Manager', 'Looker Studio', 'A/B Testing', 'Hotjar'] },
  { group: 'Création', items: ['Figma', 'Photoshop', 'Premiere Pro', 'Canva'] },
  { group: 'Dev & Automation', items: ['HTML/CSS', 'JavaScript', 'Zapier', 'Make'] },
]

/** « Contact » */
export const contact = {
  title: 'Discutons de votre projet',
  line: 'Une idée, un projet ? N’hésitez pas à me contacter.',
  // TODO : vraie adresse et vrai lien LinkedIn — la source n'a que des valeurs provisoires
  email: '',
  linkedin: '',
}
