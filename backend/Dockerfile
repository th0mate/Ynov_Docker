# --- Dépendances de production uniquement ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Image de test : docker build --target test ./backend ---
FROM node:22-alpine AS test
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run coverage

# --- Image finale, légère et sans droits root ---
FROM node:22-alpine AS runtime
# Render impose son propre port via $PORT : 3000 n'est que la valeur par défaut
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1:${PORT}/api/health || exit 1
CMD ["node", "src/server.js"]
