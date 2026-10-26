import type { Todo, TodoChanges } from '../types';

const BASE_URL = '/api/todos';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError('Le serveur ne répond pas. Vérifiez qu’il est bien démarré.', 0);
  }

  if (!response.ok) {
    // Le backend renvoie { error: "..." } ; on garde un message générique sinon
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.error ?? `Erreur ${response.status}`, response.status);
  }

  return (response.status === 204 ? undefined : await response.json()) as T;
}

export const todosApi = {
  list: () => request<Todo[]>(BASE_URL),

  create: (title: string) =>
    request<Todo>(BASE_URL, { method: 'POST', body: JSON.stringify({ title }) }),

  update: (id: number, changes: TodoChanges) =>
    request<Todo>(`${BASE_URL}/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),

  remove: (id: number) => request<void>(`${BASE_URL}/${id}`, { method: 'DELETE' }),

  removeCompleted: () => request<{ deleted: number }>(`${BASE_URL}/completed`, { method: 'DELETE' }),
};
