# Louis R. — portfolio « Mission »

Portfolio immersif : le scroll pilote une caméra-drone au-dessus d'un terrain topographique.
Chaque chapitre du parcours est un lieu du monde 3D.

| # | Chapitre | Scène 3D |
|---|----------|----------|
| 00 | Lancement | Aire de décollage balisée, feux clignotants |
| 01 | Profil | Noyau stratégique → 5 disciplines → audiences au sol (signaux en transit) |
| 02 | Marques | Avenue de stations : un panneau par marque, qui s'allume au survol ou au passage du drone |
| 03 | Missions | Trois écrans de contrôle ; choisir un dossier allume l'écran et oriente la caméra |
| 04–05 | Expertises / Instruments | Tour à 4 niveaux : disciplines sur l'axe, outils en orbite |
| 06 | Résultats | Chiffres peints sur une piste d'atterrissage, feux d'approche séquencés |
| 07 | Parcours | Trajectoire tracée sur le terrain au fil du scroll |
| 08 | Contact | Zone d'atterrissage et balise lumineuse |

## Stack

Vite · React 19 · TypeScript · Three.js · React Three Fiber · drei · postprocessing · Lenis.

```bash
npm install
npm run dev      # développement
npm run build    # build de production dans dist/ (chemins relatifs, déployable partout)
```

## Modifier le contenu

Tout le texte est dans `src/content.ts`. Les champs marqués `TODO` étaient des valeurs provisoires
sur le site d'origine et sont à compléter :

- `contact.email` et `contact.linkedin` (le site d'origine affichait `contact@example.com`)
- `projects[].client` et `projects[].result` — les projets d'origine étaient des contenus de test ;
  les trois dossiers reprennent les types de missions décrits dans les expertises
- l'unité du « +100 — Budget géré »
- dates / entreprises du parcours si souhaité

## Accessibilité & performance

- Tout le contenu est en HTML sémantique au-dessus du canvas (lisible, indexable, navigable au clavier).
- `prefers-reduced-motion` : scroll natif, plus de flottement caméra ni d'animations CSS.
- Mode allégé automatique sur mobile / petites configurations (pas de post-traitement, terrain simplifié).
- Sans WebGL, le site reste entièrement lisible sur un fond statique.
