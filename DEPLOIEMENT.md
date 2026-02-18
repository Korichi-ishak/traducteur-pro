# 🚀 Guide de Déploiement - Traducteur Pro

## ✅ Checklist de préparation

Avant de déployer, assurez-vous d'avoir:

- [ ] Un compte Supabase avec un projet créé
- [ ] La migration SQL appliquée dans Supabase
- [ ] Un compte GitHub avec le code pushé
- [ ] Un compte Render.com
- [ ] Un compte Vercel.com

## 📋 Étape 1: Configurer Supabase

### 1.1 Créer le projet

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Créez un nouveau projet
3. Notez l'URL et la clé service_role

### 1.2 Appliquer la migration

1. Dans Supabase, allez dans **SQL Editor**
2. Copiez le contenu de `supabase/migrations/001_create_translation_tables.sql`
3. Collez et exécutez

✅ Vous devriez voir 3 tables créées: `profiles`, `translation_history`, `revision_stats`

## 🔧 Étape 2: Déployer le Backend sur Render

### 2.1 Créer le Web Service

1. Allez sur [render.com](https://render.com)
2. Cliquez sur **New +** → **Web Service**
3. Connectez votre repository GitHub
4. Sélectionnez la branche `main`

### 2.2 Configuration

Configurez comme suit:

**Informations de base:**
- **Name**: `traducteur-pro-api`
- **Region**: `Frankfurt` (EU) ou `Oregon` (US)
- **Branch**: `main`
- **Root Directory**: (laisser vide)
- **Environment**: `Node`
- **Build Command**: 
  ```bash
  cd server && npm install
  ```
- **Start Command**: 
  ```bash
  cd server && node server.js
  ```

**Plan**: Choisissez le plan gratuit pour commencer

### 2.3 Variables d'environnement

Cliquez sur **Advanced** → **Add Environment Variable** et ajoutez:

| Clé | Valeur |
|-----|--------|
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | Votre URL Supabase (ex: `https://xxxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Votre clé service_role depuis Supabase |
| `CLIENT_URL` | (À ajouter après avoir déployé sur Vercel) |

⚠️ **Important**: Ne partagez JAMAIS la `SUPABASE_SERVICE_ROLE_KEY` publiquement!

### 2.4 Déployer

1. Cliquez sur **Create Web Service**
2. Attendez que le déploiement se termine (~2-5 min)
3. Notez l'URL de votre API (ex: `https://traducteur-pro-api.onrender.com`)

✅ Testez votre API en visitant: `https://votre-api.onrender.com/`

Vous devriez voir:
```json
{
  "message": "🌍 Traducteur Pro API",
  "version": "1.0.0",
  "endpoints": ["/api/translate", "/api/quick-translate"]
}
```

## 🌐 Étape 3: Déployer le Frontend sur Vercel

### 3.1 Importer le projet

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **Add New...** → **Project**
3. Importez votre repository GitHub
4. Sélectionnez la branche `main`

### 3.2 Configuration

Vercel détectera automatiquement Vite. Configurez:

**Build & Development Settings:**
- **Framework Preset**: `Vite`
- **Root Directory**: `client`
- **Build Command**: `npm run build` (par défaut)
- **Output Directory**: `dist` (par défaut)
- **Install Command**: `npm install` (par défaut)

### 3.3 Variables d'environnement

Cliquez sur **Environment Variables** et ajoutez:

| Name | Value |
|------|-------|
| `VITE_API_URL` | L'URL de votre API Render (ex: `https://traducteur-pro-api.onrender.com`) |

⚠️ **Important**: N'oubliez pas le préfixe `VITE_` pour que Vite puisse lire la variable!

### 3.4 Déployer

1. Cliquez sur **Deploy**
2. Attendez que le déploiement se termine (~1-3 min)
3. Notez l'URL de votre application (ex: `https://traducteur-pro.vercel.app`)

✅ Testez votre application en ouvrant l'URL dans votre navigateur!

## 🔗 Étape 4: Lier le Frontend et le Backend

### 4.1 Mettre à jour CLIENT_URL sur Render

1. Retournez sur [render.com](https://render.com)
2. Ouvrez votre Web Service
3. Allez dans **Environment**
4. Ajoutez/Modifiez la variable `CLIENT_URL`:
   - **Valeur**: L'URL de votre app Vercel (ex: `https://traducteur-pro.vercel.app`)
5. Cliquez sur **Save Changes**
6. Le service redémarrera automatiquement

### 4.2 Tester la connexion

1. Ouvrez votre application Vercel
2. Essayez de traduire un mot
3. Si ça fonctionne, l'historique/révision/stats devraient aussi fonctionner! ✅

## 🐛 Dépannage

### Erreur CORS

**Symptôme**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**:
1. Vérifiez que `CLIENT_URL` est correctement configuré sur Render
2. Vérifiez que l'URL correspond EXACTEMENT à celle de Vercel (avec https://)
3. Redémarrez le service sur Render

### L'historique ne se sauvegarde pas

**Symptôme**: Les traductions fonctionnent mais l'historique disparaît au rechargement

**Solution**:
1. Vérifiez que Supabase est bien configuré
2. Dans Render, vérifiez les variables `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`
3. Vérifiez que la migration SQL a été appliquée
4. Consultez les logs Render pour voir les erreurs

### Le serveur est lent à démarrer

**Symptôme**: Première requête prend 30-60 secondes

**Explication**: Le plan gratuit de Render met le serveur en veille après 15 min d'inactivité. La première requête le réveille.

**Solutions**:
- Passez au plan payant ($7/mois) pour garder le serveur actif
- Utilisez un service de "ping" pour garder le serveur éveillé (UptimeRobot)

### Erreur 503 sur Render

**Symptôme**: `Service Unavailable`

**Solution**:
1. Vérifiez les logs Render pour voir l'erreur
2. Vérifiez que le Build Command et Start Command sont corrects
3. Vérifiez que `package.json` est dans le dossier `server/`

## 📊 Surveiller votre application

### Logs Render

Pour voir ce qui se passe côté serveur:
1. Allez sur render.com
2. Ouvrez votre Web Service
3. Cliquez sur **Logs**

### Analytics Vercel

Pour voir les visites et performances:
1. Allez sur vercel.com
2. Ouvrez votre projet
3. Cliquez sur **Analytics**

### Base de données Supabase

Pour voir les données:
1. Allez sur app.supabase.com
2. Ouvrez votre projet
3. Cliquez sur **Table Editor**

## 🔄 Mises à jour

### Déployer une nouvelle version

**Backend (Render)**:
1. Pushez vos changements sur GitHub
2. Render redéploiera automatiquement

**Frontend (Vercel)**:
1. Pushez vos changements sur GitHub
2. Vercel redéploiera automatiquement

### Rollback en cas de problème

**Sur Render**:
1. Allez dans **Deploys**
2. Trouvez un déploiement qui fonctionne
3. Cliquez sur **Rollback**

**Sur Vercel**:
1. Allez dans **Deployments**
2. Trouvez un déploiement qui fonctionne
3. Cliquez sur les trois points → **Promote to Production**

## 💰 Coûts

### Plan Gratuit

**Render** (gratuit):
- 750h/mois d'exécution
- Serveur se met en veille après 15 min d'inactivité
- Suffisant pour usage personnel

**Vercel** (gratuit):
- 100 GB de bande passante/mois
- Builds illimités
- Suffisant pour ~10,000 visites/mois

**Supabase** (gratuit):
- 500 MB de base de données
- 50,000 requêtes/mois
- Suffisant pour ~1000 utilisateurs actifs

### Passage au plan payant

Si vous dépassez les limites gratuites:

**Render** ($7/mois):
- Serveur actif 24/7
- Temps de réponse plus rapide

**Vercel** ($20/mois):
- 1 TB de bande passante
- Support prioritaire

**Supabase** ($25/mois):
- 8 GB de base de données
- 500 GB de bande passante
- Sauvegardes automatiques

## ✅ Checklist finale

Avant de dire que c'est terminé:

- [ ] ✅ Backend déployé sur Render et accessible
- [ ] ✅ Frontend déployé sur Vercel et accessible
- [ ] ✅ Supabase configuré et migration appliquée
- [ ] ✅ Variables d'environnement configurées partout
- [ ] ✅ CLIENT_URL correctement configuré sur Render
- [ ] ✅ VITE_API_URL correctement configuré sur Vercel
- [ ] ✅ Traduction fonctionne
- [ ] ✅ Historique se sauvegarde
- [ ] ✅ Mode révision fonctionne
- [ ] ✅ Statistiques s'affichent

## 🎉 Félicitations!

Votre application est maintenant en ligne et accessible depuis n'importe où dans le monde! 🌍

Partagez l'URL Vercel avec vos amis pour qu'ils puissent l'utiliser aussi!

---

**Besoin d'aide?** Consultez la documentation:
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
