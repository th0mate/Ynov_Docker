import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.vue';
import { todosApi } from '../../src/api/todos';
import { makeTodo } from '../factories';

vi.mock('../../src/api/todos', () => ({
  todosApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    removeCompleted: vi.fn(),
  },
}));

const api = vi.mocked(todosApi);

async function mountApp() {
  const wrapper = mount(App);
  await flushPromises();
  return wrapper;
}

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('résume le nombre de tâches restantes dans le titre', async () => {
    api.list.mockResolvedValue([
      makeTodo({ id: 1 }),
      makeTodo({ id: 2 }),
      makeTodo({ id: 3, completed: true }),
    ]);
    const wrapper = await mountApp();

    expect(wrapper.get('h1').text()).toBe('Il reste 2 tâches.');
    expect(wrapper.findAll('.todo')).toHaveLength(3);
  });

  it('accorde le titre au singulier et quand tout est terminé', async () => {
    api.list.mockResolvedValue([makeTodo({ id: 1 })]);
    api.update.mockResolvedValue(makeTodo({ id: 1, completed: true }));
    const wrapper = await mountApp();

    expect(wrapper.get('h1').text()).toBe('Il reste une tâche.');

    await wrapper.get('input[type="checkbox"]').trigger('change');
    await flushPromises();

    expect(wrapper.get('h1').text()).toBe('Plus rien à faire.');
  });

  it('invite à créer une première tâche quand la liste est vide', async () => {
    api.list.mockResolvedValue([]);
    const wrapper = await mountApp();

    expect(wrapper.get('h1').text()).toBe('Rien de prévu.');
    expect(wrapper.text()).toContain('première tâche');
    expect(wrapper.find('.filters').exists()).toBe(false);
  });

  it('propose de réessayer si le chargement échoue', async () => {
    api.list.mockRejectedValueOnce(new Error('Le serveur ne répond pas.'));
    const wrapper = await mountApp();

    expect(wrapper.get('[role="alert"]').text()).toContain('Le serveur ne répond pas.');

    api.list.mockResolvedValue([makeTodo()]);
    await wrapper.get('[role="alert"] button').trigger('click');
    await flushPromises();

    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.findAll('.todo')).toHaveLength(1);
  });

  it('permet de fermer une erreur survenue sur une liste existante', async () => {
    api.list.mockResolvedValue([makeTodo({ id: 1, completed: true })]);
    api.removeCompleted.mockRejectedValue(new Error('Erreur 500'));
    const wrapper = await mountApp();

    await wrapper.get('.board__footer button').trigger('click');
    await flushPromises();

    const alert = wrapper.get('[role="alert"]');
    expect(alert.get('button').text()).toBe('Fermer');

    await alert.get('button').trigger('click');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('affiche un message adapté quand un filtre ne renvoie rien', async () => {
    api.list.mockResolvedValue([makeTodo({ id: 1, completed: true })]);
    const wrapper = await mountApp();

    await wrapper.findAll('.filters__tab')[1].trigger('click');
    expect(wrapper.get('.empty').text()).toBe('Tout est terminé.');

    api.list.mockResolvedValue([makeTodo({ id: 1 })]);
    const other = await mountApp();
    await other.findAll('.filters__tab')[2].trigger('click');
    expect(other.get('.empty').text()).toMatch(/Aucune tâche terminée/);
  });

  it('ajoute, renomme et supprime une tâche', async () => {
    api.list.mockResolvedValue([]);
    api.create.mockResolvedValue(makeTodo({ id: 9, title: 'Préparer la démo' }));
    api.update.mockResolvedValue(makeTodo({ id: 9, title: 'Préparer la soutenance' }));
    api.remove.mockResolvedValue(undefined);
    const wrapper = await mountApp();

    await wrapper.get('#new-todo').setValue('Préparer la démo');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('.todo').text()).toContain('Préparer la démo');

    await wrapper.get('.todo__title').trigger('dblclick');
    await wrapper.get('.todo__field').setValue('Préparer la soutenance');
    await wrapper.get('.todo__field').trigger('keydown', { key: 'Enter' });
    await flushPromises();
    expect(api.update).toHaveBeenCalledWith(9, { title: 'Préparer la soutenance' });

    await wrapper.get('button[aria-label^="Supprimer"]').trigger('click');
    await flushPromises();
    expect(api.remove).toHaveBeenCalledWith(9);
  });
});
