import { vi } from 'vitest';
import type { todosApi } from '../src/api/todos';
import type { Todo } from '../src/types';

export function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 1,
    title: 'Écrire le Dockerfile',
    completed: false,
    createdAt: '2026-10-25T10:00:00.000Z',
    updatedAt: '2026-10-25T10:00:00.000Z',
    ...overrides,
  };
}

// Double de l'API dont chaque méthode est un mock configurable
export function makeFakeApi(initial: Todo[] = []) {
  return {
    list: vi.fn().mockResolvedValue(initial),
    create: vi.fn((title: string) => Promise.resolve(makeTodo({ id: 100, title }))),
    update: vi.fn((id: number, changes: Partial<Todo>) => {
      const current = initial.find((t) => t.id === id) ?? makeTodo({ id });
      return Promise.resolve({ ...current, ...changes });
    }),
    remove: vi.fn().mockResolvedValue(undefined),
    removeCompleted: vi.fn().mockResolvedValue({ deleted: 1 }),
  } satisfies typeof todosApi;
}
