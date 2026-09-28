# Louis R. — portfolio « La Ligne »

Portfolio éditorial en 3D : le parcours est une seule ligne tracée sur du papier millimétré,
de 2018 à aujourd'hui. Le scroll encre la ligne et déplace la caméra d'un chapitre à l'autre.

| # | Chapitre | Ce qui se passe |
|---|----------|-----------------|
| 00 | Hero | Nom, rôle, la ligne se dessine au chargement |
| 01 | Marques | Les 14 marques en logos monochromes, rangées par secteur ; la 3D s'efface |
| 02 | Profil | Le métier en une phrase, puis le sommaire des trois stops |
| 03 | Stop 01 — Brand Attention | Planches accrochées le long de la ligne ; travelling sur rail, arrêt net sur chaque projet |
| 04 | Stop 02 — Community Engine | Réseau marque → profils → communautés, tracé étape par étape du rôle ; orbite |
| 05 | Stop 03 — Future Systems | Workflow en vue éclatée ; travelling compensé vers l'axonométrie, quarts de tour |
| 06 | Parcours | Vue d'ensemble de la ligne, chiffres de carrière, étapes |
| 07 | Contact | La ligne pointillée qui continue après aujourd'hui |

L'**Index** (en-tête, ou `#index`) liste toutes les marques avec leur stop, projet, année et catégorie.

## Stack

Vite · React 19 · TypeScript · Three.js · React Three Fiber · drei · Lenis.

```bash
npm install
npm run dev      # développement
npm run build    # build de production dans dist/ (chemins relatifs, déployable partout)
```

## Modifier le contenu

Les stops, projets et marques sont dans `src/lib/portfolio-data.ts` :

- pour relier une marque à un projet, ajoutez son id dans `brandIds` du projet : la fiche, l'Index
  et les filtres se mettent à jour seuls ;
- `image` sur un projet du Stop 01 remplace la planche hachurée par le visuel (traité en deux encres) ;
- `logo` sur une marque (chemin d'image) remplace le logo par défaut ;
- `SHOW_GAPS` affiche « À compléter » sur les champs vides ; passez-le à `false` au lancement.

Les logos viennent de [simple-icons](https://simpleicons.org) (CC0), dans `src/lib/logos.ts`.
Nintendo, Prime Video et POCO n'y figurent pas : ils sont composés en typographie tant qu'aucun
fichier n'est fourni.

Le reste du texte est dans `src/content.ts`. À compléter :

- `contact.email` et `contact.linkedin` (le site d'origine affichait `contact@example.com`) ;
- l'unité du « +100 de budget géré » ;
- dates et entreprises du parcours si souhaité ;
- pour chaque projet : contexte, livrables, marques, année, résultat.

## Accessibilité & performance

- Tout le contenu est en HTML sémantique au-dessus du canvas (lisible, indexable, navigable au clavier).
- `prefers-reduced-motion` : scroll natif, caméra sans amorti, pas d'animation CSS.
- Sans WebGL, un plan statique de la ligne (années, aujourd'hui) remplace la 3D.
- Pas de post-traitement ; les scènes n'utilisent que des lignes, des plans et des instances.
