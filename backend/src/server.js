import { createApp } from './app.js';
import { config } from './config.js';
import { createPool } from './db.js';
import { createTodoRepository } from './repositories/todoRepository.js';

const pool = createPool(config.db);

const app = createApp({
  todoRepository: createTodoRepository(pool),
  checkDatabase: () => pool.query('SELECT 1'),
});

const server = app.listen(config.port, () => {
  console.log(`API disponible sur le port ${config.port}`);
});

// Arrêt propre lors d'un `docker stop` : on termine les requêtes puis on ferme le pool
function shutdown(signal) {
  console.log(`${signal} reçu, arrêt du serveur…`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
