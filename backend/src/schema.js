// Une base hébergée n'exécute pas database/init.sql : le backend crée donc la table au démarrage.
// Ce schéma doit rester identique à celui de database/init.sql.
export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS todos (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(200) NOT NULL CHECK (char_length(btrim(title)) > 0),
    completed   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
  )`;

export async function ensureSchema(pool) {
  await pool.query(SCHEMA_SQL);
}
