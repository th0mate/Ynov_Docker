import express from 'express';
import { errorHandler, notFound } from './errors.js';
import { createTodoRouter } from './routes/todos.js';

// Les dépendances sont injectées pour pouvoir tester l'API sans base de données
export function createApp({ todoRepository, checkDatabase }) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', async (req, res) => {
    try {
      await checkDatabase();
      res.json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  });

  app.use('/api/todos', createTodoRouter(todoRepository));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
