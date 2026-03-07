# 🔄 Comment mettre à jour votre site Yondly ?

Voici la procédure simple pour modifier votre site et le mettre à jour sur Internet.
Gardez ce fichier précieusement !

## 1. Faire vos modifications
Modifiez les fichiers dans le dossier `website-yondly/frontend/src` comme d'habitude (Textes, Images, Couleurs...).

## 2. Créer la version "Production"
Une fois que vous êtes content de vos changements en local :
1.  Ouvrez votre terminal (VS Code).
2.  Assurez-vous d'être dans le bon dossier :
    ```bash
    cd website-yondly/frontend
    ```
3.  Lancez la commande de construction :
    ```bash
    npm run build
    ```
    *(Cela va créer/mettre à jour le dossier `build` avec votre nouveau site).*

## 3. Mettre en ligne (FTP)
1.  Connectez-vous à votre **Manager Infomaniak** > **Hébergement Web** > **FTP / SSH**.
2.  Ouvrez le dossier de votre site (ex: `/sites/yondly.app`).
3.  **Supprimez** tout ce qui s'y trouve (ou écrasez-le).
4.  Envoyez **tout le contenu** du dossier `build` (qui est sur votre ordinateur) vers le dossier du site sur Infomaniak.

👉 **Astuce** : Le plus simple est de compresser le dossier `build` en `site.zip`, de l'envoyer, et de faire "Clic Droit > Décompresser" sur Infomaniak (comme on a fait ensemble !).

## 4. Vérifier
Allez sur `yondly.app` et faites un "Force Refresh" (Cmd + Shift + R) pour voir vos changements !

---
*Note technique : Les fichiers `mail.php` (pour les emails) et `.htaccess` (pour le routing) sont automatiquement inclus dans le "build", vous n'avez pas à vous en soucier.*
