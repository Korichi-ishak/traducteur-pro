# 🚀 DÉMARRAGE RAPIDE - Traducteur Pro

## ✨ Toutes les fonctionnalités :

1. **🌍 Traducteur** - Traduction détaillée de mots et phrases
2. **📚 Historique** - Sauvegarde automatique avec recherche et export
3. **🧠 Mode Révision** - Flashcards avec répétition espacée  
4. **📊 Statistiques** - Suivi de progression et niveau de maîtrise

---

## 🚀 Installation et Démarrage

### Option 1 : Démarrage automatique (Recommandé)

1. Ouvrez PowerShell dans ce dossier
2. Exécutez :
   ```powershell
   .\start.ps1
   ```

L'application démarrera automatiquement et s'ouvrira dans votre navigateur !

---

### Option 2 : Démarrage manuel

**Terminal 1 - Serveur** :
```powershell
cd server
npm install
npm start
```

**Terminal 2 - Client** :
```powershell
cd client
npm install
npm start
```

---

## 📱 Accès depuis mobile

1. Trouvez votre IP : `ipconfig` → IPv4 Address (ex: 192.168.1.100)
2. Modifiez `client\.env` → `REACT_APP_API_URL=http://192.168.1.100:5000`
3. Redémarrez le client (Ctrl+C puis `npm start`)
4. Sur mobile : `http://192.168.1.100:3000`

---

## 🎯 Guide d'utilisation rapide

### 🌍 Traducteur
- Traduction de mots avec définitions, synonymes, exemples
- Traduction de phrases avec vocabulaire mot à mot
- **Sauvegarde automatique dans l'historique**

### 📚 Historique  
- Tous vos mots traduits
- Recherche rapide
- Export en fichier texte
- Retraduire ou supprimer des mots

### 🧠 Révision
- Flashcards interactives
- 5 niveaux de maîtrise (☆☆☆☆☆ → ★★★★★)
- Répétition espacée intelligente
- Statistiques de session

### 📊 Statistiques
- Progression globale
- Mots maîtrisés vs en apprentissage
- Taux de réussite
- Série de jours consécutifs 🔥

---

## 💡 Conseils

**Pour bien apprendre** :
1. Traduisez des mots en mode détaillé
2. Révisez avec les flashcards régulièrement
3. Maintenez votre série de jours consécutifs
4. Consultez vos statistiques

**Répétition espacée** :
- ☆ : révision dans 4h (si erreur)
- ★★ : révision dans 1-3 jours
- ★★★★ : révision dans 7-14 jours
- ★★★★★ : maîtrisé !

---

## ⚠️ Première utilisation ?

Si vous obtenez une erreur, installez d'abord Node.js :
👉 https://nodejs.org/

---

Consultez [README.md](README.md) pour plus de détails.
