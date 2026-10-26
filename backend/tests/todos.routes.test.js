import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { createInMemoryTodoRepository } from './helpers/inMemoryTodoRepository.js';

const seed = [
  { id: 1, title: 'Installer Docker', completed: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 2, title: 'Écrire le compose', completed: false, createdAt: '2026-01-02', updatedAt: '2026-01-02' },
];

function buildApp(overrides = {}) {
  return createApp({
    todoRepository: createInMemoryTodoRepository(seed),
    checkDatabase: async () => {},
    ...overrides,
  });
}

describe('API /api/todos', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
  });

  describe('GET /api/todos', () => {
    it('renvoie toutes les tâches, les plus récentes en premier', async () => {
      const res = await request(app).get('/api/todos');

      expect(res.status).toBe(200);
      expect(res.body.map((t) => t.id)).toEqual([2, 1]);
    });
  });

  describe('POST /api/todos', () => {
    it('crée une tâche et renvoie 201', async () => {
      const res = await request(app).post('/api/todos').send({ title: '  Tester l’API ' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ id: 3, title: 'Tester l’API', completed: false });
    });

    it('renvoie 400 si le titre est invalide', async () => {
      const res = await request(app).post('/api/todos').send({ title: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/vide/);
    });

    it('renvoie 400 si le JSON est mal formé', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Content-Type', 'application/json')
        .send('{"title":');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/JSON/);
    });
  });

  describe('PATCH /api/todos/:id', () => {
    it('met à jour l’état d’une tâche sans toucher au titre', async () => {
      const res = await request(app).patch('/api/todos/2').send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 2, completed: true, title: 'Écrire le compose' });
    });

    it('renvoie 404 pour une tâche inexistante', async () => {
      const res = await request(app).patch('/api/todos/99').send({ completed: true });
      expect(res.status).toBe(404);
    });

    it('renvoie 400 pour un identifiant invalide', async () => {
      const res = await request(app).patch('/api/todos/abc').send({ completed: true });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('supprime la tâche et renvoie 204', async () => {
      const res = await request(app).delete('/api/todos/1');
      expect(res.status).toBe(204);

      const list = await request(app).get('/api/todos');
      expect(list.body).toHaveLength(1);
    });

    it('renvoie 404 pour une tâche inexistante', async () => {
      const res = await request(app).delete('/api/todos/99');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/todos/completed', () => {
    it('supprime uniquement les tâches terminées', async () => {
      const res = await request(app).delete('/api/todos/completed');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: 1 });

      const list = await request(app).get('/api/todos');
      expect(list.body.every((t) => !t.completed)).toBe(true);
    });
  });
});

describe('Gestion des erreurs', () => {
  it('renvoie 404 pour une route inconnue', async () => {
    const res = await request(buildApp()).get('/api/inconnue');
    expect(res.status).toBe(404);
  });

  it('renvoie 500 sans exposer le détail de l’erreur', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const repository = createInMemoryTodoRepository();
    repository.findAll = async () => {
      throw new Error('connexion refusée');
    };

    const res = await request(buildApp({ todoRepository: repository })).get('/api/todos');

    expect(res.status).toBe(500);
    expect(res.body.error).not.toMatch(/connexion/);
  });
});

describe('GET /api/health', () => {
  it('renvoie ok quand la base répond', async () => {
    const res = await request(buildApp()).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('renvoie 503 quand la base est indisponible', async () => {
    const checkDatabase = async () => {
      throw new Error('down');
    };
    const res = await request(buildApp({ checkDatabase })).get('/api/health');

    expect(res.status).toBe(503);
  });
});
