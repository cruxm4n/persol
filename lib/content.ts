/**
 * Tout le contenu éditorial du portfolio.
 * Source : https://louisr.lovable.app (textes, marques, expertises, stack, chiffres).
 * Les champs marqués TODO étaient des valeurs provisoires sur le site d'origine :
 * remplacez-les ici, le site se met à jour sans toucher au reste du code.
 */

export const identity = {
  name: 'Louis R.',
  initials: 'LR',
  role: 'Digital Marketing Manager',
  available: true,
  tagline:
    'Spécialiste du marketing digital et de la stratégie numérique. Je transforme vos ambitions en campagnes performantes et mémorables.',
  since: 2018,
}

/** Hero copy: only facts from the original site, stated plainly. */
export const hero = {
  lede: "Je conçois et pilote des campagnes d'influence, de social media et de publicité, de la stratégie jusqu'au reporting.",
  brands: 'Pour ASUS ROG, Netflix, Red Bull, Samsung, Orange et neuf autres marques, en direct ou via agence.',
}

export const profile = {
  title: 'Relier une marque à ses audiences',
  lead:
    "Je relie des marques à leurs audiences avec la stratégie, les créateurs, les contenus et les médias payants, et j'utilise l'IA pour aller plus vite.",
  body:
    "Depuis 2018, je pilote des campagnes de la stratégie à l'exécution et au reporting, en direct ou via agence, pour des marques de la tech, du gaming, du divertissement, des télécoms et du sport.",
  /** Le parcours se lit en trois stops : voir src/lib/portfolio-data.ts */
  routeIntro: 'Le parcours se lit en trois arrêts, un par type de projet.',
}

/** Chiffres de carrière du site d'origine. Ils ne sont rattachés à aucun projet. */
export const stats: { value: string; label: string; note?: string }[] = [
  { value: '+200', label: 'campagnes' },
  { value: '+500', label: 'clients' },
  // TODO : préciser l'unité du budget géré (ex. « +100 k€ »)
  { value: '+100', label: 'de budget géré', note: 'Unité à préciser' },
  { value: '2018', label: 'première campagne' },
]

/** Parcours — TODO : ajouter entreprises / dates précises si souhaité */
export const journey = [
  { at: '2018', title: 'Premières campagnes', text: 'Campagnes digitales : SEO, SEA, social ads.' },
  { at: 'Étape 02', title: 'Influence', text: "Stratégie et activation avec des créateurs de contenu, pour l'engagement et la notoriété." },
  { at: 'Étape 03', title: 'Pilotage', text: "Coordination d'équipes et de projets, de la stratégie au reporting, en direct ou via agence." },
  { at: "Aujourd'hui", title: 'Digital Marketing Manager', text: 'Contenu, influence, social media, publicité et IA.' },
]

export const contact = {
  title: 'La suite de la ligne',
  text: 'Une campagne à lancer, des créateurs à activer, un workflow à automatiser : écrivez-moi.',
  // TODO : remplacer par la vraie adresse et le lien LinkedIn
  email: 'contact@example.com',
  linkedin: { label: 'Louis R.', url: '#' },
}

export const chapters = [
  { id: 'lancement', code: '00', label: 'Lancement' },
  { id: 'marques', code: '01', label: 'Marques' },
  { id: 'profil', code: '02', label: 'Profil' },
  { id: 'brand-attention', code: '03', label: 'Brand Attention' },
  { id: 'community-engine', code: '04', label: 'Community Engine' },
  { id: 'future-systems', code: '05', label: 'Future Systems' },
  { id: 'parcours', code: '06', label: 'Parcours' },
  { id: 'contact', code: '07', label: 'Contact' },
] as const
