ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
COPY package*.json ./

# --- Dépendances de production uniquement ---
FROM base AS deps
RUN npm ci --omit=dev \
 && npm cache clean --force

# --- Tests et couverture ---
FROM base AS test
RUN npm ci
COPY . .
RUN ["npm", "run", "coverage"]

# --- Image finale, sans outils de développement ni droits root ---
FROM node:${NODE_VERSION}-alpine AS runtime

# Un ARG déclaré avant FROM n'est pas visible ici : ceux-ci appartiennent à l'étape
ARG APP_VERSION
ARG APP_PORT=3000

LABEL org.opencontainers.image.title="todo-backend" \
      org.opencontainers.image.description="API REST Express de la todo list" \
      org.opencontainers.image.version="${APP_VERSION:-dev}" \
      org.opencontainers.image.authors="th0mate" \
      org.opencontainers.image.source="https://github.com/th0mate/Ynov_Docker"

# PORT reste surchargeable à l'exécution (Render impose le sien)
ENV NODE_ENV=production \
    PORT=${APP_PORT}

WORKDIR /app

# Le code appartient à root : l'utilisateur node peut le lire, pas le modifier
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

USER node

EXPOSE ${APP_PORT}/tcp

# Signal attendu par server.js pour terminer les requêtes et fermer le pool PostgreSQL
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" || exit 1

# L'image se comporte comme l'exécutable node : CMD fournit le script lancé par défaut
#   docker run --rm todo-backend --version
ENTRYPOINT ["node"]
CMD ["src/server.js"]
