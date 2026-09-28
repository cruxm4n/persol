# Louis R. — portfolio « La Maquette »

Portfolio scrollable en cinq actes. Le parcours est une maquette à l'échelle 1:50 posée sur une
table à dessin, dans une pièce sombre ; le scroll est le seul moteur (pas de déplacement libre) :
la caméra suit une trajectoire prédéfinie par acte.

| Acte | Nom | État |
|------|-----|------|
| 01 | Signal | En cours : panneau 4 × 3 miniature, allumage des lampes, recul qui révèle la maquette |
| 02 | Attention | À construire (après validation de l'acte 01) |
| 03 | Network | À construire |
| 04 | System | À construire |
| 05 | Contact | À construire |

La version précédente (« La Ligne », Vite) est au commit `64e2aa3`.

## Stack

Next.js 16 (export statique) · TypeScript · React Three Fiber · drei · postprocessing · GSAP · Lenis.

```bash
npm install
npm run assets   # télécharge les matières générées (Higgsfield) dans public/textures
npm run dev      # http://localhost:3000
NODE_ENV=production npm run build   # export statique dans out/
```

Ajouter `?q=low` à l'URL force le profil léger (mobile / machine lente).

## Structure

- `components/experience/` : `PortfolioExperience` (orchestration), `Stage` (canvas, effets),
  `ExperienceCamera` (trajectoire), `Act01Signal` (maquette), `intro.ts` (séquence d'ouverture).
- `components/overlays/` : HUD, progression 01/05, archive des marques, textes de l'acte 01.
- `components/ui/` : chargeur, curseur (repère de coupe), révélation de texte, annotations
  épinglées à la maquette, bouton magnétique.
- `lib/` : données (`portfolio-data.ts`, `content.ts`, `logos.ts`), `camera-paths.ts`,
  `scene-config.ts`, `motion-config.ts`, `responsive-config.ts`, `textures.ts` (affiche, feuille,
  étiquette dessinées au canvas), `scroll.ts`, `experience-store.ts`.

## Assets

`assets/manifest.json` liste les matières générées avec Higgsfield (bois, papier, épreuve
d'imprimerie, papier listing, kraft) : URL, usage, acte. `npm run assets` les convertit en JPEG
dans `public/textures/`. Sans ces fichiers, le site utilise des matières procédurales.

## Contenu à compléter

Rien n'est inventé : les champs inconnus restent vides (`SHOW_GAPS` dans `lib/portfolio-data.ts`).
À fournir : liens marque → projet → année, résultats, visuels, unité du « +100 budget géré »,
e-mail et LinkedIn.
