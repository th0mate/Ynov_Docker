<script setup lang="ts">
import { computed, onMounted } from 'vue';
import TodoComposer from './components/TodoComposer.vue';
import TodoFilters from './components/TodoFilters.vue';
import TodoItem from './components/TodoItem.vue';
import { useTodos } from './composables/useTodos';

const {
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
} = useTodos();

onMounted(load);

const now = new Date();
const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);

// Le titre de la page résume à lui seul l'état de la liste
const headline = computed(() => {
  if (loading.value && todos.value.length === 0) return 'Chargement…';
  if (todos.value.length === 0) return 'Rien de prévu.';
  if (remaining.value === 0) return 'Plus rien à faire.';
  return remaining.value === 1 ? 'Il reste une tâche.' : `Il reste ${remaining.value} tâches.`;
});

const counts = computed(() => ({
  all: todos.value.length,
  active: remaining.value,
  completed: completedCount.value,
}));

const emptyMessage = computed(() =>
  filter.value === 'active' ? 'Tout est terminé.' : 'Aucune tâche terminée pour l’instant.',
);

// Si le chargement initial a échoué, on propose de réessayer plutôt que de fermer
const canRetry = computed(() => todos.value.length === 0);
</script>

<template>
  <main class="page">
    <header class="masthead">
      <p class="masthead__date">
        <time :datetime="now.toISOString().slice(0, 10)">{{ today }}</time>
      </p>
      <h1 class="masthead__title" aria-live="polite">{{ headline }}</h1>
    </header>

    <TodoComposer :submit="add" />

    <div v-if="error" class="alert" role="alert">
      <p>{{ error }}</p>
      <button v-if="canRetry" class="text-button" type="button" @click="load">Réessayer</button>
      <button v-else class="text-button" type="button" @click="dismissError">Fermer</button>
    </div>

    <section v-if="todos.length" class="board" aria-label="Liste des tâches">
      <TodoFilters v-model="filter" :counts="counts" />

      <TransitionGroup tag="ul" name="row" class="list">
        <TodoItem
          v-for="todo in visibleTodos"
          :key="todo.id"
          :todo="todo"
          @toggle="toggle"
          @rename="rename"
          @remove="remove"
        />
      </TransitionGroup>

      <p v-if="visibleTodos.length === 0" class="empty">{{ emptyMessage }}</p>

      <footer v-if="completedCount > 0" class="board__footer">
        <button class="text-button" type="button" @click="clearCompleted">
          Effacer les terminées ({{ completedCount }})
        </button>
      </footer>
    </section>

    <p v-else-if="!loading && !error" class="empty">
      Écrivez votre première tâche ci-dessus, puis appuyez sur Entrée.
    </p>
  </main>
</template>
