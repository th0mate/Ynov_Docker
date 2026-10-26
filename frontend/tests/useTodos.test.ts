import { describe, expect, it } from 'vitest';
import { useTodos } from '../src/composables/useTodos';
import { makeFakeApi, makeTodo } from './factories';

const seed = () => [
  makeTodo({ id: 1, title: 'Installer Docker', completed: true }),
  makeTodo({ id: 2, title: 'Écrire le compose' }),
  makeTodo({ id: 3, title: 'Tester' }),
];

async function setup(initial = seed()) {
  const api = makeFakeApi(initial);
  const store = useTodos(api);
  await store.load();
  return { api, store };
}

describe('useTodos', () => {
  it('charge les tâches et calcule les compteurs', async () => {
    const { store } = await setup();

    expect(store.todos.value).toHaveLength(3);
    expect(store.remaining.value).toBe(2);
    expect(store.completedCount.value).toBe(1);
    expect(store.loading.value).toBe(false);
  });

  it('filtre les tâches selon le filtre actif', async () => {
    const { store } = await setup();

    store.filter.value = 'active';
    expect(store.visibleTodos.value.map((t) => t.id)).toEqual([2, 3]);

    store.filter.value = 'completed';
    expect(store.visibleTodos.value.map((t) => t.id)).toEqual([1]);

    store.filter.value = 'all';
    expect(store.visibleTodos.value).toHaveLength(3);
  });

  it('expose le message d’erreur si le chargement échoue', async () => {
    const api = makeFakeApi();
    api.list.mockRejectedValue(new Error('Le serveur ne répond pas.'));
    const store = useTodos(api);

    await store.load();

    expect(store.error.value).toBe('Le serveur ne répond pas.');
    expect(store.loading.value).toBe(false);
  });

  it('utilise un message par défaut pour une erreur inconnue', async () => {
    const api = makeFakeApi();
    api.list.mockRejectedValue('oups');
    const store = useTodos(api);

    await store.load();

    expect(store.error.value).toMatch(/inattendue/);
  });

  it('ajoute une nouvelle tâche en tête de liste', async () => {
    const { store } = await setup();

    await expect(store.add('Préparer la démo')).resolves.toBe(true);
    expect(store.todos.value[0].title).toBe('Préparer la démo');
  });

  it('renvoie false si l’ajout échoue', async () => {
    const { api, store } = await setup();
    api.create.mockRejectedValue(new Error('Titre invalide'));

    await expect(store.add('x')).resolves.toBe(false);
    expect(store.todos.value).toHaveLength(3);
    expect(store.error.value).toBe('Titre invalide');
  });

  it('bascule l’état d’une tâche', async () => {
    const { api, store } = await setup();

    await store.toggle(2);

    expect(api.update).toHaveBeenCalledWith(2, { completed: true });
    expect(store.todos.value.find((t) => t.id === 2)?.completed).toBe(true);
  });

  it('annule la bascule si l’API échoue', async () => {
    const { api, store } = await setup();
    api.update.mockRejectedValue(new Error('Erreur 500'));

    await store.toggle(2);

    expect(store.todos.value.find((t) => t.id === 2)?.completed).toBe(false);
  });

  it('renomme une tâche', async () => {
    const { api, store } = await setup();

    await store.rename(3, '  Tester l’interface ');

    expect(api.update).toHaveBeenCalledWith(3, { title: 'Tester l’interface' });
    expect(store.todos.value.find((t) => t.id === 3)?.title).toBe('Tester l’interface');
  });

  it('n’appelle pas l’API si le titre est vide ou inchangé', async () => {
    const { api, store } = await setup();

    await store.rename(3, '   ');
    await store.rename(3, 'Tester');

    expect(api.update).not.toHaveBeenCalled();
  });

  it('restaure l’ancien titre si le renommage échoue', async () => {
    const { api, store } = await setup();
    api.update.mockRejectedValue(new Error('Erreur 500'));

    await store.rename(3, 'Autre titre');

    expect(store.todos.value.find((t) => t.id === 3)?.title).toBe('Tester');
  });

  it('ignore les identifiants inconnus', async () => {
    const { api, store } = await setup();

    await store.toggle(42);
    await store.rename(42, 'x');
    await store.remove(42);

    expect(api.update).not.toHaveBeenCalled();
    expect(api.remove).not.toHaveBeenCalled();
  });

  it('supprime une tâche', async () => {
    const { store } = await setup();

    await store.remove(2);

    expect(store.todos.value.map((t) => t.id)).toEqual([1, 3]);
  });

  it('réinsère la tâche à sa place si la suppression échoue', async () => {
    const { api, store } = await setup();
    api.remove.mockRejectedValue(new Error('Erreur 500'));

    await store.remove(2);

    expect(store.todos.value.map((t) => t.id)).toEqual([1, 2, 3]);
  });

  it('efface les tâches terminées', async () => {
    const { store } = await setup();

    await store.clearCompleted();

    expect(store.todos.value.every((t) => !t.completed)).toBe(true);
    expect(store.completedCount.value).toBe(0);
  });

  it('dismissError efface le message', async () => {
    const { api, store } = await setup();
    api.removeCompleted.mockRejectedValue(new Error('Erreur 500'));

    await store.clearCompleted();
    expect(store.error.value).toBe('Erreur 500');

    store.dismissError();
    expect(store.error.value).toBeNull();
  });
});
