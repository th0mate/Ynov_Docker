export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TodoChanges = Partial<Pick<Todo, 'title' | 'completed'>>;

export type Filter = 'all' | 'active' | 'completed';

export const TITLE_MAX_LENGTH = 200;
