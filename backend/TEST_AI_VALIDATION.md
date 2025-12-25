# Test de la Validation IA - Guide Rapide

## ✅ Configuration Terminée

Votre clé API Google Cloud Vision est configurée !

## 🔄 Redémarrer le Backend

**Dans le terminal où tourne le backend :**

1. Arrêter le serveur : `Ctrl+C`
2. Relancer : `./start_backend.sh`

Le backend va maintenant utiliser l'API Key pour valider les photos.

## 🧪 Tester la Validation

### Test 1 : Vérifier que l'API est active

```bash
cd backend
source venv/bin/activate
python -c "
from food_validator import get_validator
validator = get_validator()
if validator.client:
    print('✅ API Vision activée !')
else:
    print('❌ API Vision non configurée')
"
```

### Test 2 : Créer un don dans l'app

1. Ouvrir l'app mobile
2. Aller dans "Dons alimentaires"
3. Cliquer sur "+"
4. Ajouter une photo de **pâtes emballées** → Devrait passer ✅
5. Essayer avec une photo de **lasagnes maison** → Devrait être bloqué ❌

## 📊 Surveiller les Coûts

- Allez sur [Google Cloud Console](https://console.cloud.google.com/)
- Menu → "Billing" → "Reports"
- Filtrer par "Cloud Vision API"

## ⚠️ Si ça ne fonctionne pas

1. Vérifier que le backend est bien redémarré
2. Vérifier les logs du backend pour voir les messages
3. Vérifier que la clé API est valide dans Google Cloud Console

## 🎯 Prochaines Étapes

Une fois que vous avez testé et confirmé que ça fonctionne :
- Les utilisateurs ne pourront plus poster de plats préparés
- Seuls les produits secs seront acceptés
- Un message clair s'affichera en cas de rejet
