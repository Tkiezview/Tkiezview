# TkiezView — Next.js + Tailwind + PWA (Staging Ready)

## Lancer en local
```bash
npm i
npm run dev
# http://localhost:3000
```

## Déployer sur Vercel (prod + staging)
- Branche **main** = production
- Branche **staging** = préproduction (preview URL)

Étapes :
1) Crée un repo GitHub et pousse `main` puis `staging`.
2) Sur vercel.com → New Project → Import ton repo → Deploy.
3) Dans Project Settings → Git :
   - Production Branch: `main`
   - Preview Deployments: ON (défaut)
4) Ouvre l’URL de staging sur ton téléphone. Ajoute à l’écran d’accueil.

## PWA
- `public/manifest.webmanifest`
- `public/sw.js`
- `public/icons/icon-192.png`, `icon-512.png`

Le code enregistre le SW et affiche “Installer l’app” quand possible.

Bon déploiement !
