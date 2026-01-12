# 🔐 Configuration Google Sign-In

## Étape 1 : Aller sur Google Cloud Console

1. Ouvrez https://console.cloud.google.com/
2. Connectez-vous avec votre compte Google

---

## Étape 2 : Créer un projet

1. En haut, cliquez sur le menu déroulant des projets
2. Cliquez sur **"Nouveau projet"**
3. Nom du projet : `Yondly` (ou le nom de votre app)
4. Cliquez **Créer**
5. Attendez 30 secondes, puis sélectionnez ce projet

---

## Étape 3 : Activer l'API

1. Dans le menu à gauche, allez dans **APIs & Services** → **Bibliothèque**
2. Cherchez "Google Identity" ou "Google Sign-In"
3. Cliquez sur **Google Identity Toolkit API**
4. Cliquez **Activer**

---

## Étape 4 : Créer les identifiants OAuth

1. Menu gauche → **APIs & Services** → **Identifiants**
2. Cliquez **+ Créer des identifiants** → **ID client OAuth**
3. Si demandé, configurez d'abord l'écran de consentement :
   - Type : **Externe**
   - Nom de l'app : `Yondly`
   - Email assistance : votre email
   - Cliquez **Enregistrer et continuer** (pas besoin de remplir les scopes)

---

## Étape 5 : Créer 3 Client IDs

### 5.1 Pour le Web (requis pour Expo Go)
1. **+ Créer des identifiants** → **ID client OAuth**
2. Type : **Application Web**
3. Nom : `Yondly Web`
4. **Notez le Client ID** (ressemble à : `xxxxx.apps.googleusercontent.com`)

### 5.2 Pour iOS
1. **+ Créer des identifiants** → **ID client OAuth**
2. Type : **iOS**
3. Nom : `Yondly iOS`
4. Bundle ID : `com.yondly.app` *(à adapter si différent)*
5. **Notez le Client ID**

### 5.3 Pour Android
1. **+ Créer des identifiants** → **ID client OAuth**
2. Type : **Android**
3. Nom : `Yondly Android`
4. Package name : `com.yondly.app` *(même que Bundle ID)*
5. SHA-1 : Pour le dev, utilisez la commande ci-dessous

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1
```

---

## Étape 6 : Notez vos credentials

Une fois terminé, vous devriez avoir 3 Client IDs. Envoyez-les moi :

```
GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=xxxx.apps.googleusercontent.com  
GOOGLE_ANDROID_CLIENT_ID=xxxx.apps.googleusercontent.com
```

---

## ⏱️ Temps estimé : 10-15 minutes

Une fois que vous avez ces 3 IDs, dites-le moi et j'intègrerai Google Sign-In dans l'app !
