# --- Build de l'application (TypeScript vérifié puis bundle Vite) ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Image de test : docker build --target test ./frontend ---
FROM build AS test
RUN npm run coverage

# --- Fichiers statiques servis par Nginx, qui relaie aussi /api vers le backend ---
FROM nginx:1.27-alpine AS runtime
# Valeurs par défaut pour docker compose, remplacées par l'hébergeur en production
ENV PORT=80 \
    BACKEND_URL=http://backend:3000
# Au démarrage, l'image génère conf.d/default.conf à partir de ce modèle (envsubst)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1:${PORT}/ > /dev/null || exit 1
