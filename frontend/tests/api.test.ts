import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, todosApi } from '../src/api/todos';
import { makeTodo } from './factories';

function mockFetch(status: number, body?: unknown) {
  const response = new Response(body === undefined ? null : JSON.stringify(body), { status });
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
}

describe('todosApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('list récupère les tâches', async () => {
    const todos = [makeTodo()];
    const fetchMock = mockFetch(200, todos);

    await expect(todosApi.list()).resolves.toEqual(todos);
    expect(fetchMock).toHaveBeenCalledWith('/api/todos', expect.any(Object));
  });

  it('create envoie le titre en JSON', async () => {
    const fetchMock = mockFetch(201, makeTodo());

    await todosApi.create('Nouvelle tâche');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/todos');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify({ title: 'Nouvelle tâche' }));
  });

  it('update cible la tâche par son identifiant', async () => {
    const fetchMock = mockFetch(200, makeTodo({ completed: true }));

    await todosApi.update(7, { completed: true });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/todos/7');
    expect(fetchMock.mock.calls[0][1]?.method).toBe('PATCH');
  });

  it('remove gère une réponse 204 sans contenu', async () => {
    mockFetch(204);
    await expect(todosApi.remove(3)).resolves.toBeUndefined();
  });

  it('removeCompleted appelle la route dédiée', async () => {
    const fetchMock = mockFetch(200, { deleted: 2 });

    await expect(todosApi.removeCompleted()).resolves.toEqual({ deleted: 2 });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/todos/completed');
  });

  it('remonte le message d’erreur renvoyé par le backend', async () => {
    mockFetch(400, { error: 'Le titre ne peut pas être vide' });

    await expect(todosApi.create('')).rejects.toMatchObject({
      message: 'Le titre ne peut pas être vide',
      status: 400,
    });
  });

  it('utilise un message générique si la réponse d’erreur n’est pas du JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>', { status: 502 }));

    await expect(todosApi.list()).rejects.toThrow('Erreur 502');
  });

  it('signale clairement un serveur injoignable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    const promise = todosApi.list();
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toThrow('ne répond pas');
  });
});
