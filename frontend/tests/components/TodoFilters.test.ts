import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TodoFilters from '../../src/components/TodoFilters.vue';

const counts = { all: 5, active: 3, completed: 2 };

describe('TodoFilters', () => {
  it('affiche chaque filtre avec son compteur', () => {
    const wrapper = mount(TodoFilters, { props: { modelValue: 'all', counts } });
    const tabs = wrapper.findAll('button').map((b) => b.text().replace(/\s+/g, ' '));

    expect(tabs).toEqual(['Toutes 5', 'À faire 3', 'Terminées 2']);
  });

  it('indique le filtre actif via aria-pressed', () => {
    const wrapper = mount(TodoFilters, { props: { modelValue: 'active', counts } });
    const pressed = wrapper.findAll('button').map((b) => b.attributes('aria-pressed'));

    expect(pressed).toEqual(['false', 'true', 'false']);
  });

  it('émet le filtre choisi', async () => {
    const wrapper = mount(TodoFilters, { props: { modelValue: 'all', counts } });

    await wrapper.findAll('button')[2].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['completed']]);
  });
});
