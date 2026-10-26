import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import TodoComposer from '../../src/components/TodoComposer.vue';
import { TITLE_MAX_LENGTH } from '../../src/types';

function mountComposer(result = true) {
  const submit = vi.fn().mockResolvedValue(result);
  const wrapper = mount(TodoComposer, { props: { submit } });
  return { wrapper, submit, input: wrapper.get('input') };
}

describe('TodoComposer', () => {
  it('désactive le bouton tant que le champ est vide', async () => {
    const { wrapper, input } = mountComposer();
    const button = wrapper.get('button');

    expect(button.attributes('disabled')).toBeDefined();

    await input.setValue('   ');
    expect(button.attributes('disabled')).toBeDefined();

    await input.setValue('Réviser');
    expect(button.attributes('disabled')).toBeUndefined();
  });

  it('envoie le titre nettoyé et vide le champ après succès', async () => {
    const { wrapper, submit, input } = mountComposer(true);

    await input.setValue('  Réviser le cours  ');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(submit).toHaveBeenCalledWith('Réviser le cours');
    expect((input.element as HTMLInputElement).value).toBe('');
  });

  it('conserve la saisie si la création échoue', async () => {
    const { wrapper, input } = mountComposer(false);

    await input.setValue('Réviser');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect((input.element as HTMLInputElement).value).toBe('Réviser');
  });

  it('n’envoie rien si le champ est vide', async () => {
    const { wrapper, submit } = mountComposer();

    await wrapper.get('form').trigger('submit');

    expect(submit).not.toHaveBeenCalled();
  });

  it('affiche le nombre de caractères restants près de la limite', async () => {
    const { wrapper, input } = mountComposer();

    expect(wrapper.find('.composer__count').exists()).toBe(false);

    await input.setValue('a'.repeat(TITLE_MAX_LENGTH - 5));
    const count = wrapper.get('.composer__count');
    expect(count.text()).toBe('5');
    expect(count.classes()).toContain('is-low');
  });
});
