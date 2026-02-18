# ✅ Checklist de Déploiement Rapide

## 🎯 Avant de commencer

- [ ] Compte Supabase créé → [app.supabase.com](https://app.supabase.com)
- [ ] Compte GitHub créé et code pushé
- [ ] Compte Render créé → [render.com](https://render.com)
- [ ] Compte Vercel créé → [vercel.com](https://vercel.com)

## 📦 Étape 1: Supabase (5 minutes)

- [ ] Créer un nouveau projet Supabase
- [ ] Copier l'URL du projet (ex: `https://xxxxx.supabase.co`)
- [ ] Copier la clé `service_role` (Settings → API)
- [ ] Aller dans SQL Editor
- [ ] Copier/coller le contenu de `supabase/migrations/001_create_translation_tables.sql`
- [ ] Exécuter le SQL (RUN)
- [ ] Vérifier que 3 tables sont créées (Table Editor)

## 🔧 Étape 2: Render - Backend (10 minutes)

- [ ] New + → Web Service
- [ ] Connecter le repository GitHub
- [ ] **Name**: `traducteur-pro-api`
- [ ] **Region**: Frankfurt (Europe) ou Oregon (US)
- [ ] **Build Command**: `cd server && npm install`
- [ ] **Start Command**: `cd server && node server.js`
- [ ] **Environment**: Node

### Variables d'environnement:

- [ ] `SUPABASE_URL` = votre URL Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = votre clé service_role
- [ ] `NODE_ENV` = `production`

- [ ] Cliquer sur "Create Web Service"
- [ ] Attendre le déploiement (~3 minutes)
- [ ] **Copier l'URL** (ex: `https://traducteur-pro-api.onrender.com`)
- [ ] Tester en ouvrant l'URL dans le navigateur (devrait afficher le message d'API)

## 🌐 Étape 3: Vercel - Frontend (5 minutes)

- [ ] Add New → Project
- [ ] Importer le repository GitHub
- [ ] **Framework Preset**: Vite (détecté automatiquement)
- [ ] **Root Directory**: `client`
- [ ] **Build Command**: `npm run build`
- [ ] **Output Directory**: `dist`

### Variable d'environnement:

- [ ] `VITE_API_URL` = votre URL Render (ex: `https://traducteur-pro-api.onrender.com`)

- [ ] Cliquer sur "Deploy"
- [ ] Attendre le déploiement (~2 minutes)
- [ ] **Copier l'URL** (ex: `https://traducteur-pro.vercel.app`)
- [ ] Ouvrir l'URL et tester une traduction

## 🔗 Étape 4: Connecter Frontend et Backend (2 minutes)

- [ ] Retourner sur Render
- [ ] Ouvrir le Web Service
- [ ] Aller dans Environment
- [ ] Ajouter la variable `CLIENT_URL` = votre URL Vercel
- [ ] Sauvegarder (le service redémarrera automatiquement)

## 🎉 Étape 5: Tester l'application

- [ ] Ouvrir l'URL Vercel
- [ ] Traduire un mot
- [ ] Vérifier que l'historique se sauvegarde
- [ ] Tester le mode révision
- [ ] Vérifier les statistiques

## ✅ C'EST TERMINÉ!

Votre application est en ligne! 🚀

**URL de l'application**: `_____________________` (noter ici)

---

## 🐛 Si quelque chose ne fonctionne pas:

1. **Erreur CORS**: Vérifier que `CLIENT_URL` est correct sur Render
2. **Historique ne se sauvegarde pas**: Vérifier les variables Supabase sur Render
3. **Serveur lent**: Normal pour le plan gratuit Render (premier démarrage après 15 min d'inactivité)

📖 **Guide détaillé**: Voir `DEPLOIEMENT.md`
