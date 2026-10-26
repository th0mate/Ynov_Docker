import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTodoRepository } from '../src/repositories/todoRepository.js';

const row = { id: 1, title: 'Tâche', completed: false, createdAt: 'x', updatedAt: 'x' };

describe('todoRepository', () => {
  let pool;
  let repository;

  beforeEach(() => {
    pool = { query: vi.fn() };
    repository = createTodoRepository(pool);
  });

  it('findAll renvoie les lignes triées par date décroissante', async () => {
    pool.query.mockResolvedValue({ rows: [row] });

    await expect(repository.findAll()).resolves.toEqual([row]);
    expect(pool.query.mock.calls[0][0]).toMatch(/ORDER BY created_at DESC/);
  });

  it('create insère le titre via une requête paramétrée', async () => {
    pool.query.mockResolvedValue({ rows: [row] });

    await expect(repository.create({ title: 'Tâche' })).resolves.toEqual(row);
    expect(pool.query).toHaveBeenCalledWith(expect.stringMatching(/^INSERT INTO todos/), ['Tâche']);
  });

  it('update transmet null pour les champs non modifiés', async () => {
    pool.query.mockResolvedValue({ rows: [{ ...row, completed: true }] });

    await repository.update(1, { completed: true });
    expect(pool.query.mock.calls[0][1]).toEqual([1, null, true]);
  });

  it('update renvoie null si la tâche n’existe pas', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await expect(repository.update(99, { title: 'x' })).resolves.toBeNull();
  });

  it('remove indique si une ligne a été supprimée', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 });

    await expect(repository.remove(1)).resolves.toBe(true);
    await expect(repository.remove(1)).resolves.toBe(false);
  });

  it('removeCompleted renvoie le nombre de tâches supprimées', async () => {
    pool.query.mockResolvedValue({ rowCount: 3 });

    await expect(repository.removeCompleted()).resolves.toBe(3);
    expect(pool.query.mock.calls[0][0]).toMatch(/WHERE completed = TRUE/);
  });
});
