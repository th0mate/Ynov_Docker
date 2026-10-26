ARG POSTGRES_VERSION=17

FROM postgres:${POSTGRES_VERSION}-alpine

ARG APP_VERSION

LABEL org.opencontainers.image.title="todo-db" \
      org.opencontainers.image.description="PostgreSQL initialisé pour la todo list" \
      org.opencontainers.image.version="${APP_VERSION:-dev}" \
      org.opencontainers.image.authors="th0mate" \
      org.opencontainers.image.source="https://github.com/th0mate/Ynov_Docker"

ENV POSTGRES_DB=todo \
    POSTGRES_USER=todo

WORKDIR /docker-entrypoint-initdb.d
COPY --chmod=0444 init.sql ./01-init.sql

VOLUME ["/var/lib/postgresql/data"]

EXPOSE 5432/tcp

STOPSIGNAL SIGINT

HEALTHCHECK --interval=5s --timeout=3s --retries=10 \
  CMD pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" || exit 1

CMD ["postgres"]
