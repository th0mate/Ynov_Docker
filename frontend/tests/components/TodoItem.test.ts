import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TodoItem from '../../src/components/TodoItem.vue';
import { makeTodo } from '../factories';

function mountItem(overrides = {}) {
  return mount(TodoItem, { props: { todo: makeTodo({ id: 5, ...overrides }) } });
}

describe('TodoItem', () => {
  it('affiche le titre et l’état de la tâche', () => {
    const wrapper = mountItem({ completed: true });

    expect(wrapper.text()).toContain('Écrire le Dockerfile');
    expect(wrapper.classes()).toContain('is-done');
    expect((wrapper.get('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(true);
  });

  it('émet toggle quand on coche la case', async () => {
    const wrapper = mountItem();

    await wrapper.get('input[type="checkbox"]').trigger('change');

    expect(wrapper.emitted('toggle')).toEqual([[5]]);
  });

  it('émet remove au clic sur Supprimer', async () => {
    const wrapper = mountItem();

    await wrapper.get('button[aria-label^="Supprimer"]').trigger('click');

    expect(wrapper.emitted('remove')).toEqual([[5]]);
  });

  it('passe en édition au double-clic et émet rename avec Entrée', async () => {
    const wrapper = mountItem();

    await wrapper.get('.todo__title').trigger('dblclick');
    const field = wrapper.get('.todo__field');
    expect((field.element as HTMLInputElement).value).toBe('Écrire le Dockerfile');

    await field.setValue('  Écrire les Dockerfiles ');
    await field.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('rename')).toEqual([[5, 'Écrire les Dockerfiles']]);
    expect(wrapper.find('.todo__field').exists()).toBe(false);
  });

  it('ouvre l’édition depuis le bouton Modifier', async () => {
    const wrapper = mountItem();

    await wrapper.get('button[aria-label^="Modifier"]').trigger('click');

    expect(wrapper.find('.todo__field').exists()).toBe(true);
  });

  it('annule l’édition avec Échap', async () => {
    const wrapper = mountItem();

    await wrapper.get('.todo__title').trigger('dblclick');
    await wrapper.get('.todo__field').setValue('Autre chose');
    await wrapper.get('.todo__field').trigger('keydown', { key: 'Escape' });

    expect(wrapper.emitted('rename')).toBeUndefined();
    expect(wrapper.text()).toContain('Écrire le Dockerfile');
  });

  it('n’émet rien si le titre est vide ou inchangé', async () => {
    const wrapper = mountItem();

    await wrapper.get('.todo__title').trigger('dblclick');
    await wrapper.get('.todo__field').setValue('   ');
    await wrapper.get('.todo__field').trigger('blur');

    await wrapper.get('.todo__title').trigger('dblclick');
    await wrapper.get('.todo__field').trigger('blur');

    expect(wrapper.emitted('rename')).toBeUndefined();
  });

  it('n’émet qu’une seule fois quand Entrée est suivi d’un blur', async () => {
    const wrapper = mountItem();

    await wrapper.get('.todo__title').trigger('dblclick');
    const field = wrapper.get('.todo__field');
    await field.setValue('Nouveau titre');
    // Le blur est déclenché par le démontage du champ juste après Entrée
    const input = field.element as HTMLInputElement;
    await field.trigger('keydown', { key: 'Enter' });
    input.dispatchEvent(new Event('blur'));

    expect(wrapper.emitted('rename')).toHaveLength(1);
  });
});
