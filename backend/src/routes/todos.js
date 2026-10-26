import { Router } from 'express';
import { HttpError } from '../errors.js';
import { parseId, validateCreate, validateUpdate } from '../validation.js';

// Express 5 transmet automatiquement les erreurs des handlers async à errorHandler
export function createTodoRouter(todoRepository) {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await todoRepository.findAll());
  });

  router.post('/', async (req, res) => {
    const todo = await todoRepository.create(validateCreate(req.body));
    res.status(201).json(todo);
  });

  // Déclarée avant /:id pour ne pas être interprétée comme un identifiant
  router.delete('/completed', async (req, res) => {
    const deleted = await todoRepository.removeCompleted();
    res.json({ deleted });
  });

  router.patch('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const todo = await todoRepository.update(id, validateUpdate(req.body));
    if (!todo) throw new HttpError(404, 'Tâche introuvable');
    res.json(todo);
  });

  router.delete('/:id', async (req, res) => {
    const removed = await todoRepository.remove(parseId(req.params.id));
    if (!removed) throw new HttpError(404, 'Tâche introuvable');
    res.status(204).end();
  });

  return router;
}
