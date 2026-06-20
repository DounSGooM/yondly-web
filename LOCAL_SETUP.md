# Guide de Configuration Locale

Ce guide vous explique comment lancer l'application Loop entièrement en local, sans dépendre de serveurs externes.

## Prérequis

- Python 3.8+
- Node.js & npm
- MongoDB (doit être installé et lancé sur le port 27017)
- Un terminal (Terminal, iTerm, VS Code, etc.)

## 1. Backend (API)

Le backend est une application Python FastAPI.

### Installation

Il est recommandé d'utiliser un environnement virtuel :

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration Supabase (Cloud)

La base de données est hébergée sur Supabase (PostgreSQL) :

1. Créez un projet sur [Supabase](https://supabase.com/dashboard).
2. Récupérez l'URL du projet et la clé service dans **Project Settings → API** :
   - `SUPABASE_URL` (ex. `https://xxxx.supabase.co`)
   - `SUPABASE_SERVICE_KEY` (clé `service_role`)
3. Appliquez les migrations SQL présentes dans `backend/migrations/` via l'éditeur SQL Supabase.

Ensuite, lancez le backend avec vos identifiants :

```bash
export SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_SERVICE_KEY="votre_cle_service_role"
./start_backend.sh
```

Ou renseignez ces variables dans le fichier `backend/.env` (voir `backend/.env.example`).


### Lancement

Nous avons créé un script pour faciliter le lancement :

```bash
./start_backend.sh
```

Le serveur sera accessible sur `http://localhost:8000`.
La documentation de l'API est disponible sur `http://localhost:8000/docs`.

## 2. Frontend (Application Mobile)

Le frontend est une application React Native avec Expo.

### Configuration

Créez un fichier `.env` dans le dossier `frontend` avec le contenu suivant :

```
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Installation

```bash
cd frontend
npm install
```

### Lancement

```bash
cd frontend
npm start
```

Appuyez sur `w` pour ouvrir dans le navigateur web, ou scannez le QR code avec l'application Expo Go sur votre téléphone (assurez-vous que votre téléphone et votre ordinateur sont sur le même réseau Wi-Fi).

> **Note pour Expo Go sur téléphone :**
> Si vous utilisez votre téléphone, remplacez `localhost` par l'adresse IP locale de votre ordinateur dans le fichier `.env` (ex: `http://192.168.1.15:8000`).

## 3. Tests

Pour vérifier que tout fonctionne, vous pouvez lancer le script de test automatisé (assurez-vous que le backend est lancé dans un autre terminal) :

```bash
python3 backend_test.py
```
