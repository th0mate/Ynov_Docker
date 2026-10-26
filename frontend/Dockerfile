# syntax=docker/dockerfile:1

# Application Vue compilée puis servie par Nginx, qui relaie aussi /api vers le backend.
#   docker build -t todo-frontend ./frontend
#   docker build --target test ./frontend
#   docker run --rm -p 8080:8080 -e BACKEND_URL=http://hote:3000 todo-frontend

ARG NODE_VERSION=22
ARG NGINX_VERSION=1.27

# --- Build (vérification TypeScript puis bundle Vite) ---
# Le résultat (HTML, CSS, JS) ne dépend pas de l'architecture : on compile sur la
# plateforme native de la machine de build, même si l'image finale cible une autre plateforme.
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Tests et couverture, à partir de l'étape de build ---
FROM build AS test
RUN ["npm", "run", "coverage"]

# --- Image finale : Nginx sans droits root ---
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION}-alpine AS runtime

ARG APP_VERSION

LABEL org.opencontainers.image.title="todo-frontend" \
      org.opencontainers.image.description="Interface Vue de la todo list, servie par Nginx" \
      org.opencontainers.image.version="${APP_VERSION:-dev}" \
      org.opencontainers.image.authors="th0mate" \
      org.opencontainers.image.source="https://github.com/th0mate/Ynov_Docker"

# Valeurs par défaut pour docker compose, remplacées par l'hébergeur en production
ENV PORT=8080 \
    BACKEND_URL=http://backend:3000

WORKDIR /usr/share/nginx/html

# Au démarrage, l'image génère conf.d/default.conf depuis ce modèle (envsubst).
# Pas de --chmod ici : il s'appliquerait aussi au dossier templates/ créé, qui deviendrait illisible.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist ./

# Utilisateur déjà défini par l'image de base, rappelé pour rendre le choix explicite
USER nginx

EXPOSE 8080/tcp

# SIGQUIT demande à Nginx un arrêt gracieux (les requêtes en cours se terminent)
STOPSIGNAL SIGQUIT

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/" > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
