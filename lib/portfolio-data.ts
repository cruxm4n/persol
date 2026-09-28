/**
 * Données du parcours : trois stops, leurs projets, les marques.
 *
 * Règle : rien n'est inventé. Le site d'origine ne relie aucune marque à un
 * projet, une année ou un résultat. Tant que ces liens ne sont pas renseignés :
 *  - les projets sont des « fiches types » (draft: true) décrivant un type de mission réel ;
 *  - les champs inconnus restent vides ;
 *  - les marques ont projectIds / stopIds vides et apparaissent « non attribuées » dans l'Index.
 *
 * Pour attribuer une marque : ajoutez son id dans `brandIds` du projet concerné.
 * Brand.projectIds / stopIds sont calculés automatiquement à partir de là.
 */

export type Metric = {
  value: string
  label: string
}

export type Brand = {
  id: string
  name: string
  /** Secteur, tel qu'indiqué sur le site d'origine */
  category: string
  logo?: string
  url?: string
  projectIds: string[]
  stopIds: string[]
}

export type Project = {
  id: string
  /** « 02.1 » : numéro de stop + rang */
  number: string
  title: string
  category: string
  context: string
  role: string[]
  deliverables: string[]
  brandIds: string[]
  metrics?: Metric[]
  image?: string
  year?: string
  link?: string
  /** Fiche type : décrit un type de mission, pas encore une campagne précise */
  draft?: boolean
}

export type Stop = {
  id: string
  number: string
  title: string
  subtitle: string
  description: string
  visualDirection: string
  /** Légende de la scène 3D, affichée sous la fiche principale */
  sceneNote?: string
  /** Outils cités par le site d'origine, en métadonnée du stop */
  tools?: string[]
  /** Le premier projet est le projet principal ; 2 ou 3 secondaires maximum */
  projects: Project[]
}

/**
 * Affiche « À compléter » à la place des champs vides.
 * Passez à false au lancement : les champs vides seront simplement masqués.
 */
export const SHOW_GAPS = true

const brandList: Omit<Brand, 'projectIds' | 'stopIds'>[] = [
  { id: 'asus-rog', name: 'ASUS ROG', category: 'Tech & Gaming' },
  { id: 'asus', name: 'ASUS', category: 'Tech & Gaming' },
  { id: 'cooler-master', name: 'Cooler Master', category: 'Tech & Gaming' },
  { id: 'lenovo', name: 'Lenovo', category: 'Tech & Gaming' },
  { id: 'hp', name: 'HP', category: 'Tech & Gaming' },
  { id: 'samsung', name: 'Samsung', category: 'Tech & Gaming' },
  { id: 'xiaomi', name: 'Xiaomi', category: 'Tech & Gaming' },
  { id: 'poco', name: 'POCO', category: 'Tech & Gaming' },
  { id: 'nintendo', name: 'Nintendo', category: 'Tech & Gaming' },
  { id: 'netflix', name: 'Netflix', category: 'Divertissement' },
  { id: 'prime-video', name: 'Prime Video', category: 'Divertissement' },
  { id: 'orange', name: 'Orange', category: 'Télécom' },
  { id: 'red-bull', name: 'Red Bull', category: 'Sport & Lifestyle' },
  { id: 'nike', name: 'Nike', category: 'Sport & Lifestyle' },
]

export const stops: Stop[] = [
  {
    id: 'brand-attention',
    number: '02',
    title: 'Attention',
    subtitle: 'Faire exister une marque',
    description:
      "Des contenus, des campagnes et des lancements conçus pour qu'une marque soit vue, comprise et retenue.",
    visualDirection: 'Planches accrochées le long de la ligne ; travelling latéral, arrêts nets.',
    sceneNote: 'Les planches attendent leurs visuels : captures, photos, extraits de campagne.',
    projects: [
      {
        id: 'lancement',
        number: '02.1',
        title: 'Lancer un produit sur les plateformes sociales',
        category: 'Lancement',
        context: '',
        role: ['Direction créative', 'Production de contenus'],
        deliverables: [],
        brandIds: [],
        draft: true,
      },
      {
        id: 'campagne-contenus',
        number: '02.2',
        title: 'Une campagne de contenus de marque',
        category: 'Brand content',
        context: '',
        role: ['Direction créative', 'Production'],
        deliverables: [],
        brandIds: [],
        draft: true,
      },
      {
        id: 'activation',
        number: '02.3',
        title: 'Une activation de marque',
        category: 'Activation',
        context: '',
        role: [],
        deliverables: [],
        brandIds: [],
        draft: true,
      },
    ],
  },
  {
    id: 'community-engine',
    number: '03',
    title: 'Network',
    subtitle: "Faire porter la marque par d'autres voix",
    description:
      "Des campagnes menées avec des créateurs de contenu, pour l'engagement et la notoriété de marque. Une marque, plusieurs profils, des communautés qui se répondent.",
    visualDirection: 'Réseau marque → profils → communautés qui se trace au scroll ; trajectoire courbe.',
    sceneNote: 'Schéma : les points figurent des rôles, pas des comptes réels.',
    projects: [
      {
        id: 'reseau-createurs',
        number: '03.1',
        title: "Un réseau de créateurs autour d'une marque",
        category: 'Influence',
        context: '',
        role: ['Stratégie', 'Activation des créateurs', 'Coordination', 'Reporting'],
        deliverables: [],
        brandIds: [],
        draft: true,
      },
      {
        id: 'social-communautes',
        number: '03.2',
        title: 'Animer une communauté sur les réseaux sociaux',
        category: 'Social media',
        context: '',
        role: [],
        deliverables: [],
        brandIds: [],
        draft: true,
      },
      {
        id: 'activation-audience',
        number: '03.3',
        title: 'Activer une audience autour d’un temps fort',
        category: 'Activation',
        context: '',
        role: [],
        deliverables: [],
        brandIds: [],
        draft: true,
      },
    ],
  },
  {
    id: 'future-systems',
    number: '04',
    title: 'System',
    subtitle: 'Aller plus vite sans perdre la main',
    description:
      'Automatiser ce qui se répète pour garder le temps pour ce qui compte : IA, workflows, données.',
    visualDirection: 'Workflow en vue éclatée ; passage en axonométrie, rotations par quarts de tour.',
    sceneNote: 'Schéma : les étapes d\u2019un workflow type, pas un outil précis.',
    // stack « Dev & Automation » et « Analytics » du site d'origine
    tools: ['Zapier', 'Make', 'Looker Studio', 'Google Analytics', 'Tag Manager', 'HTML/CSS', 'JavaScript'],
    projects: [
      {
        id: 'workflow-ia',
        number: '04.1',
        title: 'Un workflow de production accéléré par l’IA',
        category: 'IA & automatisation',
        context: '',
        role: [],
        deliverables: [],
        brandIds: [],
        draft: true,
      },
      {
        id: 'reporting-auto',
        number: '04.2',
        title: 'Un reporting de campagne automatisé',
        category: 'Données',
        context: '',
        role: [],
        deliverables: [],
        brandIds: [],
        draft: true,
      },
    ],
  },
]

export const projects: Project[] = stops.flatMap((s) => s.projects)

export const stopOf = (projectId: string) => stops.find((s) => s.projects.some((p) => p.id === projectId))

/** Brands with their links derived from the projects that cite them. */
export const brands: Brand[] = brandList.map((b) => {
  const linked = projects.filter((p) => p.brandIds.includes(b.id))
  return {
    ...b,
    projectIds: linked.map((p) => p.id),
    stopIds: [...new Set(linked.map((p) => stopOf(p.id)!.id))],
  }
})

export const brandsOf = (project: Project) =>
  project.brandIds.map((id) => brands.find((b) => b.id === id)).filter((b): b is Brand => !!b)

/** One row per brand × project; unattributed brands get one row with no project. */
export type IndexRow = { brand: Brand; project?: Project; stop?: Stop }

export function brandIndex(): IndexRow[] {
  const rows: IndexRow[] = []
  for (const brand of brands) {
    if (!brand.projectIds.length) rows.push({ brand })
    for (const pid of brand.projectIds) {
      rows.push({ brand, project: projects.find((p) => p.id === pid), stop: stopOf(pid) })
    }
  }
  return rows.sort((a, b) => a.brand.name.localeCompare(b.brand.name, 'fr'))
}
