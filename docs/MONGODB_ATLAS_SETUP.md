# 🍃 Configuration MongoDB Atlas - Guide Simple

## Étape 1 : Créer un compte

1. Allez sur https://www.mongodb.com/atlas
2. Cliquez **Try Free**
3. Créez un compte (Google ou email)

---

## Étape 2 : Créer un Cluster (gratuit)

1. Après connexion, cliquez **Build a Database**
2. Choisissez **M0 FREE** (gratuit, 512 MB)
3. Provider : **AWS** ou **Google Cloud**
4. Region : **Paris (eu-west-3)** ou la plus proche
5. Cluster Name : `yondly-cluster`
6. Cliquez **Create**

⏱️ Attendez 2-3 minutes que le cluster soit créé

---

## Étape 3 : Créer un utilisateur de base de données

1. Dans le menu gauche → **Database Access**
2. Cliquez **+ Add New Database User**
3. Méthode : **Password**
4. Username : `yondly_admin`
5. Password : **Générez un mot de passe fort** (notez-le !)
6. Role : **Atlas Admin** (pour commencer)
7. Cliquez **Add User**

---

## Étape 4 : Autoriser toutes les IPs

⚠️ Pour que Cloud Run puisse se connecter :

1. Menu gauche → **Network Access**
2. Cliquez **+ Add IP Address**
3. Cliquez **ALLOW ACCESS FROM ANYWHERE** (0.0.0.0/0)
4. Cliquez **Confirm**

> Note : En production, vous pourrez restreindre plus tard

---

## Étape 5 : Récupérer l'URL de connexion

1. Retournez sur **Database** (menu gauche)
2. Sur votre cluster, cliquez **Connect**
3. Choisissez **Drivers**
4. Copiez l'URL qui ressemble à :

```
mongodb+srv://yondly_admin:<password>@yondly-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

5. **Remplacez `<password>`** par votre mot de passe
6. **Ajoutez le nom de la base** : `/yondly` avant le `?`

**URL finale :**
```
mongodb+srv://yondly_admin:VotreMotDePasse@yondly-cluster.xxxxx.mongodb.net/yondly?retryWrites=true&w=majority
```

---

## Étape 6 : Tester la connexion

Envoyez-moi l'URL (sans le mot de passe réel, juste la structure) et je vérifierai que le backend s'y connecte bien.

---

## ⏱️ Temps estimé : 5-10 minutes

Une fois que vous avez l'URL, on peut :
1. Tester la connexion en local
2. Déployer sur Cloud Run avec cette URL
