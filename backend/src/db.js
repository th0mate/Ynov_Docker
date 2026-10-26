import pg from 'pg';

export function createPool(dbConfig) {
  const pool = new pg.Pool({ ...dbConfig, max: 10 });

  // Une connexion inactive qui tombe ne doit pas faire planter le processus
  pool.on('error', (err) => console.error('Erreur PostgreSQL inattendue :', err.message));

  return pool;
}
