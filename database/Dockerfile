FROM postgres:17-alpine

# Les scripts de ce dossier sont exécutés une seule fois, à la création du volume
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql

HEALTHCHECK --interval=5s --timeout=3s --retries=10 \
  CMD pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" || exit 1
