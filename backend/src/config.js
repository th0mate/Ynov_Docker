// Les hébergeurs (Render, Neon…) fournissent une URL unique ; en local on utilise des variables séparées.
// Avec une URL, le SSL est piloté par son paramètre `sslmode` (ex. ?sslmode=require).
function databaseConfig(env) {
  if (env.DATABASE_URL) {
    return { connectionString: env.DATABASE_URL };
  }
  return {
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    user: env.DB_USER ?? 'todo',
    password: env.DB_PASSWORD ?? 'todo',
    database: env.DB_NAME ?? 'todo',
  };
}

export function loadConfig(env = process.env) {
  return {
    port: Number(env.PORT ?? 3000),
    db: databaseConfig(env),
  };
}
