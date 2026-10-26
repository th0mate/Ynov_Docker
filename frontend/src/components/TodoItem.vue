<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { TITLE_MAX_LENGTH, type Todo } from '../types';

const props = defineProps<{ todo: Todo }>();

const emit = defineEmits<{
  toggle: [id: number];
  rename: [id: number, title: string];
  remove: [id: number];
}>();

const editing = ref(false);
const draft = ref('');
const field = ref<HTMLInputElement>();

async function startEdit() {
  draft.value = props.todo.title;
  editing.value = true;
  await nextTick();
  field.value?.select();
}

// Appelé par Entrée et par la perte de focus : le garde évite un double envoi
function commit() {
  if (!editing.value) return;
  editing.value = false;

  const title = draft.value.trim();
  if (title && title !== props.todo.title) {
    emit('rename', props.todo.id, title);
  }
}

function cancel() {
  editing.value = false;
}
</script>

<template>
  <li class="todo" :class="{ 'is-done': todo.completed }">
    <label class="todo__check">
      <input
        type="checkbox"
        :checked="todo.completed"
        :aria-label="`Marquer « ${todo.title} » comme ${todo.completed ? 'à faire' : 'terminée'}`"
        @change="emit('toggle', todo.id)"
      />
      <span class="todo__box" aria-hidden="true">
        <svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" /></svg>
      </span>
    </label>

    <input
      v-if="editing"
      ref="field"
      v-model="draft"
      class="todo__field"
      type="text"
      aria-label="Modifier le titre"
      :maxlength="TITLE_MAX_LENGTH"
      @keydown.enter.prevent="commit"
      @keydown.esc.prevent="cancel"
      @blur="commit"
    />
    <p v-else class="todo__title" @dblclick="startEdit">
      <span class="todo__text">{{ todo.title }}</span>
    </p>

    <div v-if="!editing" class="todo__actions">
      <button class="icon-button" type="button" :aria-label="`Modifier « ${todo.title} »`" @click="startEdit">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M13.5 3.5l3 3L7 16H4v-3z" /></svg>
      </button>
      <button
        class="icon-button icon-button--danger"
        type="button"
        :aria-label="`Supprimer « ${todo.title} »`"
        @click="emit('remove', todo.id)"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
      </button>
    </div>
  </li>
</template>
