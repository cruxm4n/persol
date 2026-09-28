# Louis R. — portfolio « Île Signal »

Portfolio scrollable : six chapitres défilent par-dessus une petite île en 3D (low-poly, lumière douce,
du matin au coucher de soleil). Le scroll est le seul moteur : la caméra suit une trajectoire
prédéfinie et rejoint le lieu de chaque chapitre. Rien à cliquer, pas de déplacement libre.

| # | Chapitre | Lieu de l'île | Chiffre intégré à la scène |
|---|----------|---------------|----------------------------|
| 01 | Accueil | ponton, phare, vue aérienne | — |
| 02 | Expertise | studio | enseigne « 2018 · Années d'exp. » |
| 03 | Chiffres clés | rue des affiches | affiches « +200 Campagnes », « +100 Budget géré » |
| 04 | Références | village | banderole « +500 Clients » |
| 05 | Stack technique | atelier | écrans des quatre modules |
| 06 | Contact | quai au coucher de soleil | — |

Structure reprise de la version « Mission » (commit `ecd30cb`), nouvelle direction artistique.
Versions précédentes : « Mission » (`ecd30cb`), « La Ligne » (`64e2aa3`),
« La Maquette » (branche `claude/beautiful-mayer-nbq5c8`).

## Stack

Next.js 16 (export statique) · TypeScript · React Three Fiber · drei · postprocessing · GSAP · Lenis.
Typographies : Fraunces (titres), Figtree (texte).

```bash
npm install
npm run dev                          # http://localhost:3000
NODE_ENV=production npm run build    # export statique dans out/
```

`?q=low` force le profil léger (celui du mobile). Les écrans en portrait ont leur propre
trajectoire de caméra.

## Structure

- `components/PortfolioExperience.tsx` : orchestration (polices, chargeur, scroll, fallback sans WebGL).
- `components/overlays/` : `Chapters` (le contenu, en HTML), `Hud` (nom, progression 01/06).
- `components/world/` : `PortfolioWorld` (canvas, effets), `WorldLighting` (cycle du jour),
  `WorldEnvironment` (ciel, mer, île, chemin, végétation, nuages, oiseaux) et un composant par lieu.
- `components/objects/` : maison, arbres instanciés, affiches, guirlandes, modules, panneau.
- `components/camera/` : `ScrollCamera`, échantillonnage des trajectoires, réveil des lieux.
- `lib/` : `portfolio-data.ts` (tout le texte), `scene-config.ts` (zones, palette, lumière),
  `camera-paths.ts`, `island.ts` (contour, chemin, placement), `materials.ts`, `signage.ts`
  (chiffres peints dans la scène), `asset-manifest.ts`.

## Contenu

Tout vient de louisr.lovable.app (textes et base publique qu'il lit), mot pour mot. Rien n'est inventé :
les « Projets & Réalisations » du site source sont des fiches de test et ne sont pas affichés ;
l'e-mail et le LinkedIn sont des valeurs provisoires et restent « À compléter »
(`SHOW_GAPS` dans `lib/portfolio-data.ts`). À fournir : e-mail, LinkedIn, unité du « +100 Budget géré ».

## Images

`public/assets/manifest.json` liste les images générées (skill image-use) avec leur prompt et leur rôle :
cinq matières (herbe, sable, planches, tuiles, papier listing), trois affiches abstraites, une illustration
de l'île. Sans ces fichiers, les surfaces peintes dans le code et les placeholders prennent le relais.
