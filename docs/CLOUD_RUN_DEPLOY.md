# 🚀 Déploiement Cloud Run - Guide Simple

## Prérequis
- Compte Google Cloud (✅ vous l'avez)
- gcloud CLI installé

---

## Étape 1 : Installer gcloud (si pas déjà fait)

```bash
# Sur Mac avec Homebrew
brew install --cask google-cloud-sdk
```

Puis connectez-vous :
```bash
gcloud auth login
```

---

## Étape 2 : Configurer le projet

```bash
# Remplacez par l'ID de votre projet Google Cloud
gcloud config set project VOTRE_PROJECT_ID

# Activer les APIs nécessaires
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

---

## Étape 3 : Configurer les variables d'environnement

Créez un fichier `.env.production` (ne pas commiter) :

```
MONGO_URL=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/yondly
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
CLOUDINARY_CLOUD_NAME=diujw5anb
CLOUDINARY_API_KEY=248353173982663
CLOUDINARY_API_SECRET=xxxxx
JWT_SECRET=votre_secret_tres_long
```

---

## Étape 4 : Déployer ! 🚀

```bash
# Depuis la racine du projet (là où est le Dockerfile)
cd /Users/lagaville/Downloads/Loop-main

# Déployer sur Cloud Run
gcloud run deploy yondly-backend \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars "MONGO_URL=votre_url_mongodb,STRIPE_SECRET_KEY=sk_live_xxx"
```

---

## Étape 5 : Récupérer l'URL

Après le déploiement, vous verrez :
```
Service URL: https://yondly-backend-xxxxx-ew.a.run.app
```

**C'est votre nouvelle API !** 🎉

---

## Étape 6 : Mettre à jour le frontend

Dans `frontend/src/config/api.ts`, changez :
```typescript
export const API_URL = 'https://yondly-backend-xxxxx-ew.a.run.app/api';
```

---

## Commandes utiles

```bash
# Voir les logs
gcloud run services logs read yondly-backend --region europe-west1

# Redéployer après modifications
gcloud run deploy yondly-backend --source . --region europe-west1

# Voir le statut
gcloud run services describe yondly-backend --region europe-west1
```

---

## ⚠️ Important

1. **MongoDB Atlas** : Ajoutez l'IP `0.0.0.0/0` dans Atlas pour que Cloud Run puisse se connecter
2. **Stripe Webhook** : Mettez à jour l'URL du webhook dans Stripe Dashboard
3. **Variables** : Ne mettez JAMAIS les secrets dans le code, utilisez `--set-env-vars`
