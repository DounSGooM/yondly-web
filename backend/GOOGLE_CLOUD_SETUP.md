# Configuration Google Cloud Vision API

## Étapes pour configurer l'API

### 1. Créer un projet Google Cloud

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou sélectionner un projet existant
3. Noter le Project ID

### 2. Activer l'API Vision

1. Dans le menu, aller à "APIs & Services" > "Library"
2. Rechercher "Cloud Vision API"
3. Cliquer sur "Enable"

### 3. Créer un Service Account

1. Aller à "IAM & Admin" > "Service Accounts"
2. Cliquer sur "Create Service Account"
3. Nom : `loop-food-validator`
4. Rôle : `Cloud Vision API User`
5. Créer une clé JSON :
   - Cliquer sur le service account créé
   - Onglet "Keys"
   - "Add Key" > "Create new key" > "JSON"
   - Télécharger le fichier JSON

### 4. Configurer le Backend

1. Copier le fichier JSON dans le dossier backend :
   ```bash
   cp ~/Downloads/loop-service-account.json /Users/lagaville/Downloads/Loop-main/backend/
   ```

2. Ajouter la variable d'environnement dans `start_backend.sh` :
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/Users/lagaville/Downloads/Loop-main/backend/loop-service-account.json"
   ```

3. Installer les dépendances :
   ```bash
   cd backend
   source venv/bin/activate
   pip install -r requirements.txt
   ```

### 5. Tester la Configuration

```bash
cd backend
source venv/bin/activate
python -c "
from food_validator import get_validator
import asyncio

validator = get_validator()
print('✅ Validator initialized successfully')
"
```

## Alternative : Utiliser une API Key

Si vous préférez utiliser une API key au lieu d'un service account :

1. Aller à "APIs & Services" > "Credentials"
2. "Create Credentials" > "API Key"
3. Copier la clé
4. Ajouter dans `start_backend.sh` :
   ```bash
   export GOOGLE_CLOUD_VISION_API_KEY="votre-api-key"
   ```

## Coûts Estimés


- **Gratuit** : 1000 requêtes/mois
- **Au-delà** : ~$1.50 pour 1000 requêtes

Pour 100 dons/jour avec 2 photos = 200 requêtes/jour = 6000/mois
- Coût : ~$7.50/mois

## Désactiver la Validation (Mode Développement)

Si vous voulez désactiver temporairement la validation IA :

Dans `food_validator.py`, la fonction retourne automatiquement `is_valid: True` si l'API n'est pas configurée. Aucune action nécessaire pour le développement local.
