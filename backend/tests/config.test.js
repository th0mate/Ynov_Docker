import { describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config.js';
import { ensureSchema, SCHEMA_SQL } from '../src/schema.js';

describe('loadConfig', () => {
  it('utilise des valeurs par défaut adaptées au développement local', () => {
    expect(loadConfig({})).toEqual({
      port: 3000,
      db: { host: 'localhost', port: 5432, user: 'todo', password: 'todo', database: 'todo' },
    });
  });

  it('lit les variables séparées fournies par docker compose', () => {
    const config = loadConfig({ PORT: '8000', DB_HOST: 'db', DB_PORT: '6543', DB_NAME: 'app' });

    expect(config.port).toBe(8000);
    expect(config.db).toMatchObject({ host: 'db', port: 6543, database: 'app' });
  });

  it('privilégie DATABASE_URL quand elle est définie', () => {
    const url = 'postgresql://u:p@hote:5432/base?sslmode=require';

    expect(loadConfig({ DATABASE_URL: url, DB_HOST: 'ignoré' }).db).toEqual({ connectionString: url });
  });
});

describe('ensureSchema', () => {
  it('crée la table todos si elle n’existe pas', async () => {
    const pool = { query: vi.fn().mockResolvedValue({}) };

    await ensureSchema(pool);

    expect(pool.query).toHaveBeenCalledWith(SCHEMA_SQL);
    expect(SCHEMA_SQL).toMatch(/CREATE TABLE IF NOT EXISTS todos/);
  });
});
