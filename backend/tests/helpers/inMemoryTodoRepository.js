// Implémentation en mémoire du repository, avec la même interface que la version PostgreSQL
export function createInMemoryTodoRepository(initial = []) {
  let todos = initial.map((todo) => ({ ...todo }));
  let nextId = Math.max(0, ...todos.map((t) => t.id)) + 1;

  return {
    async findAll() {
      return [...todos].reverse();
    },
    async create({ title }) {
      const now = new Date().toISOString();
      const todo = { id: nextId++, title, completed: false, createdAt: now, updatedAt: now };
      todos.push(todo);
      return todo;
    },
    async update(id, changes) {
      const todo = todos.find((t) => t.id === id);
      if (!todo) return null;
      Object.assign(todo, changes, { updatedAt: new Date().toISOString() });
      return todo;
    },
    async remove(id) {
      const before = todos.length;
      todos = todos.filter((t) => t.id !== id);
      return todos.length < before;
    },
    async removeCompleted() {
      const before = todos.length;
      todos = todos.filter((t) => !t.completed);
      return before - todos.length;
    },
  };
}
