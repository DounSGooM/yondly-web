# Utiliser une image Python légère
FROM python:3.11

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY . .

# Exposer le port (Cloud Run utilise le port défini par la variable d'environnement PORT, défaut 8080)
ENV PORT=8080
EXPOSE 8080

# Commande de démarrage
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT}"]
