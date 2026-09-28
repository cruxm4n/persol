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

export const profile = {
  title: 'Relier une marque à ses audiences.',
  lead:
    "Mon métier : construire le chemin le plus court entre une marque et les gens qui comptent pour elle. Stratégie, créateurs, contenus, médias payants — et l'IA pour accélérer chaque étape.",
  body:
    "Depuis 2018, je pilote des campagnes de la stratégie à l'exécution et au reporting, en direct ou via agence, pour des marques de la tech, du gaming, du divertissement, des télécoms et du sport.",
  pillars: [
    { id: 'contenu', label: 'Contenu', note: 'Direction créative & production' },
    { id: 'influence', label: 'Influence', note: 'Créateurs, activation, engagement' },
    { id: 'social', label: 'Social media', note: 'Plateformes & communautés' },
    { id: 'pub', label: 'Publicité', note: 'SEA, Social Ads, ROI' },
    { id: 'ia', label: 'IA', note: 'Automatisation & accélération' },
  ],
}

export type Brand = { name: string; sector: string }

export const brandSectors = [
  { id: 'tech', label: 'Tech & Gaming' },
  { id: 'entertainment', label: 'Divertissement' },
  { id: 'telecom', label: 'Télécom' },
  { id: 'lifestyle', label: 'Sport & Lifestyle' },
] as const

export const brands: Brand[] = [
  { name: 'ASUS ROG', sector: 'tech' },
  { name: 'ASUS', sector: 'tech' },
  { name: 'Cooler Master', sector: 'tech' },
  { name: 'Lenovo', sector: 'tech' },
  { name: 'HP', sector: 'tech' },
  { name: 'Samsung', sector: 'tech' },
  { name: 'Xiaomi', sector: 'tech' },
  { name: 'POCO', sector: 'tech' },
  { name: 'Nintendo', sector: 'tech' },
  { name: 'Netflix', sector: 'entertainment' },
  { name: 'Prime Video', sector: 'entertainment' },
  { name: 'Orange', sector: 'telecom' },
  { name: 'Red Bull', sector: 'lifestyle' },
  { name: 'Nike', sector: 'lifestyle' },
]

export const brandsNote = 'Missions réalisées en direct ou via agence.'

export type Project = {
  id: string
  title: string
  /** Marque ou client — TODO : renseigner pour chaque étude de cas */
  client?: string
  role: string
  summary: string
  channels: string[]
  /** Résultat principal — TODO : chiffre clé de la campagne */
  result?: { value: string; label: string }
}

/**
 * Les trois projets du site d'origine étaient des contenus de test.
 * Ces dossiers reprennent les types de missions décrits dans les expertises ;
 * complétez client + résultat pour en faire de vraies études de cas.
 */
export const projects: Project[] = [
  {
    id: '01',
    title: 'Activation créateurs',
    role: 'Influence Marketing Manager',
    summary:
      "Stratégie et activation de campagnes avec des créateurs de contenu pour maximiser l'engagement et la notoriété de marque.",
    channels: ['Créateurs', 'Social media', 'Brand content'],
  },
  {
    id: '02',
    title: 'Acquisition multi-canal',
    role: 'Digital Marketing',
    summary:
      'Pilotage de campagnes multi-canal (SEO, SEA, Social Ads) avec un focus ROI et acquisition mesurable.',
    channels: ['Google Ads', 'Meta Ads', 'SEO / SEA'],
  },
  {
    id: '03',
    title: 'Production de contenus',
    role: 'Content & Production Management',
    summary:
      'Direction créative et production de contenus engageants pour plateformes sociales et campagnes digitales.',
    channels: ['Direction créative', 'Vidéo', 'Social'],
  },
]

export const expertises = [
  {
    id: '01',
    title: 'Influence Marketing Manager',
    text: "Stratégie et activation de campagnes avec des créateurs de contenu pour maximiser l'engagement et la notoriété de marque.",
  },
  {
    id: '02',
    title: 'Digital Marketing',
    text: 'Pilotage de campagnes multi-canal (SEO, SEA, Social Ads) avec un focus ROI et acquisition mesurable.',
  },
  {
    id: '03',
    title: 'Project Management',
    text: "Coordination d'équipes et gestion de projets complexes de la stratégie à l'exécution et au reporting.",
  },
  {
    id: '04',
    title: 'Content & Production Management',
    text: 'Direction créative et production de contenus engageants pour plateformes sociales et campagnes digitales.',
  },
]

export const stack = [
  { id: 'marketing', label: 'Marketing', tools: ['Google Ads', 'Meta Ads', 'SEO / SEA', 'Emailing', 'CRM', 'Growth'] },
  { id: 'analytics', label: 'Analytics', tools: ['Google Analytics', 'Tag Manager', 'Looker Studio', 'A/B Testing', 'Hotjar'] },
  { id: 'creation', label: 'Création', tools: ['Figma', 'Photoshop', 'Premiere Pro', 'Canva'] },
  { id: 'automation', label: 'Dev & Automation', tools: ['HTML/CSS', 'JavaScript', 'Zapier', 'Make'] },
]

export const stats = [
  { value: '+200', label: 'Campagnes', mark: '200' },
  { value: '+500', label: 'Clients', mark: '500' },
  // TODO : préciser l'unité du budget géré (ex. « +100 k€ »)
  { value: '+100', label: 'Budget géré', mark: '100' },
  { value: '2018', label: "Sur le terrain depuis", mark: '2018' },
]

/** Parcours — TODO : ajouter entreprises / dates précises si souhaité */
export const journey = [
  { at: '2018', title: 'Décollage', text: 'Premières campagnes digitales : SEO, SEA, social ads. Le goût de la donnée et du résultat mesurable.' },
  { at: 'Étape 02', title: 'Influence', text: "Stratégie et activation avec des créateurs de contenu, pour l'engagement et la notoriété." },
  { at: 'Étape 03', title: 'Pilotage', text: "Coordination d'équipes et de projets complexes, de la stratégie au reporting, en direct ou via agence." },
  { at: "Aujourd'hui", title: 'Digital Marketing Manager', text: 'Contenu, influence, social media, publicité et IA réunis dans une seule trajectoire.' },
]

export const contact = {
  title: 'Discutons de votre projet',
  text: "Une idée, un projet ? N'hésitez pas à me contacter.",
  // TODO : remplacer par la vraie adresse et le lien LinkedIn
  email: 'contact@example.com',
  linkedin: { label: 'Louis R.', url: '#' },
}

export const chapters = [
  { id: 'lancement', code: '00', label: 'Lancement' },
  { id: 'profil', code: '01', label: 'Profil' },
  { id: 'marques', code: '02', label: 'Marques' },
  { id: 'projets', code: '03', label: 'Missions' },
  { id: 'expertises', code: '04', label: 'Expertises' },
  { id: 'stack', code: '05', label: 'Instruments' },
  { id: 'resultats', code: '06', label: 'Résultats' },
  { id: 'parcours', code: '07', label: 'Parcours' },
  { id: 'contact', code: '08', label: 'Contact' },
] as const
