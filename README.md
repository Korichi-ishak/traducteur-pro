# 🌍 Traducteur Pro - Guide de Déploiement

Application web de traduction Allemand ⇄ Français avec fonctionnalités avancées.

## ✨ Fonctionnalités

1. **Traduction complète** - Mots et phrases avec multiples sources (Google Translate, PONS, Glosbe)
2. **Historique intelligent** - Sauvegarde automatique avec compteur de consultations
3. **Mode révision** - Flashcards avec système de répétition espacée (5 niveaux de maîtrise)
4. **Statistiques détaillées** - Suivi de progression, série de jours, taux de réussite
5. **Recherche** - Recherche rapide dans l'historique
6. **Export** - Export du vocabulaire en fichier texte
7. **Modes de traduction** - Mode mot (détaillé) et mode phrase (rapide)

## 🏗️ Architecture

### Stack Technique
- **Frontend**: React 18 (Vite)
- **Backend**: Node.js + Express
- **Base de données**: Supabase (PostgreSQL)
- **APIs de traduction**: Google Translate, PONS Dictionary, Glosbe

### Structure
```
traducteur-pro/
├── client/                 # Application React
│   ├── src/
│   │   ├── components/    # Composants React
│   │   ├── services/      # Services (API, historique)
│   │   └── App.js         # Composant principal
│   └── package.json
├── server/                # API Node.js
│   ├── routes/           # Routes API
│   ├── services/         # Services (Supabase)
│   ├── server.js         # Serveur Express
│   ├── .env              # Variables d'environnement
│   └── package.json
└── supabase/
    └── migrations/       # Scripts de migration SQL
```
```

## 🚀 Configuration locale

### Prérequis
- Node.js 18+ ([télécharger](https://nodejs.org/))
- Compte Supabase gratuit ([créer un compte](https://app.supabase.com))

### 1. Installation des dépendances

**Serveur:**
```bash
cd server
npm install
```

**Client:**
```bash
cd client
npm install
```

### 2. Configuration sans base de données (mode test)

Le serveur peut fonctionner en mode dégradé sans Supabase pour tester les traductions uniquement.

**Démarrer le serveur:**
```bash
cd server
node server.js
```

**Démarrer le client:**
```bash
cd client
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

⚠️ **Mode dégradé**: Les fonctionnalités d'historique, révision et statistiques ne fonctionneront pas sans Supabase.

## 🗄️ Configuration Supabase

### 1. Créer un projet Supabase

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Cliquez sur "New Project"
3. Choisissez un nom et un mot de passe pour la base de données
4. Sélectionnez une région (Europe recommandée pour la France)
5. Attendez que le projet soit créé (~2 minutes)

### 2. Obtenir les clés d'API

1. Dans votre projet Supabase, allez dans **Settings** → **API**
2. Copiez:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **Service Role Key** (section "Project API keys", sous "service_role")

⚠️ **IMPORTANT**: Ne JAMAIS exposer la `service_role` key dans le code client!

### 3. Configurer les variables d'environnement

Créez un fichier `.env` dans le dossier `server/`:

```bash
cd server
cp .env.example .env
```

Modifiez `.env` avec vos clés:
```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
PORT=5000
```

### 4. Appliquer la migration de base de données

1. Copiez le contenu de `supabase/migrations/001_create_translation_tables.sql`
2. Dans Supabase, allez dans **SQL Editor**
3. Cliquez sur **New Query**
4. Collez le SQL et cliquez sur **Run**

Cela créera:
- ✅ Table `profiles` (profils utilisateurs)
- ✅ Table `translation_history` (historique des traductions)
- ✅ Table `revision_stats` (statistiques de révision)
- ✅ Politiques RLS (sécurité multi-utilisateurs)
- ✅ Indexes (optimisation des requêtes)
- ✅ Triggers (mise à jour automatique)

### 5. Tester la connexion

Redémarrez le serveur:
```bash
cd server
node server.js
```

Vous devriez voir:
```
============================================================
  🌍  TRADUCTEUR PRO - Serveur Node.js
  Allemand ⇄ Français
============================================================

  ✓ Serveur démarré sur le port 5000
  ✓ API disponible sur: http://localhost:5000

============================================================
```

Si aucun avertissement Supabase n'apparaît, la connexion fonctionne! ✅

## 🌐 Déploiement

### Option 1: Déploiement sur Vercel (Frontend) + Render (Backend)

#### A. Déployer le Backend sur Render

1. **Créer un compte** sur [render.com](https://render.com)

2. **Créer un Web Service**:
   - Cliquez sur "New +" → "Web Service"
   - Connectez votre repository GitHub
   - Configuration:
     - **Build Command**: `cd server && npm install`
     - **Start Command**: `cd server && node server.js`
     - **Environment**: Node

3. **Ajouter les variables d'environnement**:
   - `SUPABASE_URL` → votre URL Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` → votre service role key
   - `PORT` → `5000` (ou laissez vide, Render l'assignera)

4. **Déployer** - Cliquez sur "Create Web Service"

5. **Noter l'URL** - Ex: `https://traducteur-pro.onrender.com`

#### B. Déployer le Frontend sur Vercel

1. **Créer un compte** sur [vercel.com](https://vercel.com)

2. **Importer le projet**:
   - Cliquez sur "Add New..." → "Project"
   - Connectez GitHub et sélectionnez votre repository

3. **Configuration**:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Variables d'environnement**:
   - Cliquez sur "Environment Variables"
   - Ajoutez:
     - `VITE_API_URL` → URL de votre serveur Render (ex: `https://traducteur-pro.onrender.com`)

5. **Mettre à jour le code client**:

Modifiez `client/src/services/historyService.js`:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

Modifiez `client/src/App.js`:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

6. **Déployer** - Vercel déploiera automatiquement

#### C. Configurer CORS sur le serveur

Modifiez `server/server.js`:
```javascript
const cors = require('cors');

// Autoriser les requêtes depuis votre frontend Vercel
app.use(cors({
  origin: [
    'http://localhost:5173', // Développement local
    'https://votre-app.vercel.app' // Production
  ],
  credentials: true
}));
```

### Option 2: Déploiement Full-Stack sur Vercel

Vous pouvez déployer le backend et frontend ensemble sur Vercel:

1. Créer `vercel.json` à la racine:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "client/dist"
      }
    },
    {
      "src": "server/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "client/dist/$1"
    }
  ]
}
```

2. Ajouter les variables d'environnement dans Vercel
3. Déployer

## 🔒 Sécurité

### Variables sensibles
- ❌ Ne jamais commiter le fichier `.env`
- ❌ Ne jamais exposer la `service_role` key côté client
- ✅ Utiliser `.env.example` comme template
- ✅ Ajouter `.env` au `.gitignore`

### Row Level Security (RLS)
Les tables Supabase utilisent RLS pour garantir que:
- Les utilisateurs ne peuvent voir que leurs propres données
- Impossible d'accéder aux données d'autres utilisateurs
- Authentification requise pour toutes les opérations

## 🔧 Développement

### Scripts disponibles

**Serveur**:
```bash
npm start              # Démarrer le serveur
node server.js         # Démarrer manuellement
```

**Client**:
```bash
npm run dev           # Démarrer en mode développement
npm run build         # Build pour production
npm run preview       # Prévisualiser le build
```

### Structure de la base de données

#### Table: `profiles`
- `id` (UUID) - ID utilisateur
- `email` (TEXT)
- Timestamps

#### Table: `translation_history`
- `id` (UUID)
- `user_id` (UUID)
- `word` (TEXT)
- `main_translation` (TEXT)
- `translations` (JSONB)
- `senses` (JSONB)
- `synonyms` (JSONB)
- `examples` (JSONB)
- `phrases` (JSONB)
- `src_lang`, `tgt_lang` (TEXT)
- `lookup_count` (INTEGER)
- `revision_score` (INTEGER 0-5)
- `next_revision` (TIMESTAMP)
- `times_correct`, `times_incorrect` (INTEGER)
- Timestamps

#### Table: `revision_stats`
- `id` (UUID)
- `user_id` (UUID)
- `total_sessions` (INTEGER)
- `total_words_reviewed` (INTEGER)
- `total_correct`, `total_incorrect` (INTEGER)
- `streak_days` (INTEGER)
- `last_session` (TIMESTAMP)
- Timestamps

## 📝 API Endpoints

### Traduction
- `POST /api/translate` - Traduction complète (mot ou phrase)
- `POST /api/quick-translate` - Traduction rapide (Google uniquement)

### Historique
- `GET /api/history` - Récupérer l'historique
- `POST /api/history` - Ajouter/mettre à jour une entrée
- `GET /api/history/search?q=mot` - Rechercher
- `DELETE /api/history/:id` - Supprimer une entrée
- `DELETE /api/history` - Effacer tout l'historique

### Révision
- `GET /api/history/revision/words?limit=20` - Mots à réviser
- `POST /api/history/revision` - Enregistrer résultat
- `POST /api/history/revision/session` - Mettre à jour les stats

### Statistiques
- `GET /api/history/statistics` - Statistiques complètes

## 🐛 Dépannage

### Le serveur ne démarre pas
```bash
# Vérifier le port 5000
netstat -ano | findstr :5000

# Changer le port
# Dans .env: PORT=3001
```

### Erreur Supabase
```bash
# Vérifier les variables d'environnement
cd server
cat .env

# Vérifier la connexion
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"
```

### CORS errors
Vérifiez que l'URL du frontend est autorisée dans `server/server.js`:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'https://votre-app.vercel.app']
}));
```

## 📄 Licence

MIT

## 👨‍💻 Auteur

Développé avec ❤️ pour l'apprentissage des langues

---

**Note**: Cette application utilise des API gratuites de traduction. Pour un usage en production à grande échelle, considérez des solutions payantes comme DeepL API ou Google Cloud Translation API.