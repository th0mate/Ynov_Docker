import { computed, ref } from 'vue';
import { todosApi } from '../api/todos';
import type { Filter, Todo } from '../types';

// L'API est injectable pour pouvoir tester le composable sans réseau
export function useTodos(api = todosApi) {
  const todos = ref<Todo[]>([]);
  const filter = ref<Filter>('all');
  const loading = ref(false);
  const error = ref<string | null>(null);

  const remaining = computed(() => todos.value.filter((t) => !t.completed).length);
  const completedCount = computed(() => todos.value.length - remaining.value);

  const visibleTodos = computed(() => {
    if (filter.value === 'active') return todos.value.filter((t) => !t.completed);
    if (filter.value === 'completed') return todos.value.filter((t) => t.completed);
    return todos.value;
  });

  const findTodo = (id: number) => todos.value.find((t) => t.id === id);

  function replace(updated: Todo) {
    const index = todos.value.findIndex((t) => t.id === updated.id);
    if (index !== -1) todos.value[index] = updated;
  }

  // Exécute un appel API et centralise la gestion du message d'erreur
  async function attempt(action: () => Promise<void>): Promise<boolean> {
    error.value = null;
    try {
      await action();
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Une erreur inattendue est survenue.';
      return false;
    }
  }

  async function load() {
    loading.value = true;
    await attempt(async () => {
      todos.value = await api.list();
    });
    loading.value = false;
  }

  function add(title: string) {
    return attempt(async () => {
      todos.value.unshift(await api.create(title));
    });
  }

  // Mises à jour optimistes : l'interface réagit tout de suite, on revient en arrière si l'API échoue
  async function toggle(id: number) {
    const todo = findTodo(id);
    if (!todo) return;

    const completed = !todo.completed;
    todo.completed = completed;

    const ok = await attempt(async () => replace(await api.update(id, { completed })));
    if (!ok) todo.completed = !completed;
  }

  async function rename(id: number, title: string) {
    const todo = findTodo(id);
    const trimmed = title.trim();
    if (!todo || !trimmed || trimmed === todo.title) return;

    const previous = todo.title;
    todo.title = trimmed;

    const ok = await attempt(async () => replace(await api.update(id, { title: trimmed })));
    if (!ok) todo.title = previous;
  }

  async function remove(id: number) {
    const index = todos.value.findIndex((t) => t.id === id);
    if (index === -1) return;

    const [removed] = todos.value.splice(index, 1);
    const ok = await attempt(() => api.remove(id));
    if (!ok) todos.value.splice(index, 0, removed);
  }

  function clearCompleted() {
    return attempt(async () => {
      await api.removeCompleted();
      todos.value = todos.value.filter((t) => !t.completed);
    });
  }

  function dismissError() {
    error.value = null;
  }

  return {
    todos,
    visibleTodos,
    filter,
    loading,
    error,
    remaining,
    completedCount,
    load,
    add,
    toggle,
    rename,
    remove,
    clearCompleted,
    dismissError,
  };
}
