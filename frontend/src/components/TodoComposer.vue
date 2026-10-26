<script setup lang="ts">
import { computed, ref } from 'vue';
import { TITLE_MAX_LENGTH } from '../types';

const props = defineProps<{
  // Renvoie true si la tâche a été créée : le champ n'est vidé qu'en cas de succès
  submit: (title: string) => Promise<boolean>;
}>();

const title = ref('');
const pending = ref(false);
const input = ref<HTMLInputElement>();

const trimmed = computed(() => title.value.trim());
const charsLeft = computed(() => TITLE_MAX_LENGTH - title.value.length);

async function onSubmit() {
  if (!trimmed.value || pending.value) return;

  pending.value = true;
  const created = await props.submit(trimmed.value);
  pending.value = false;

  if (created) {
    title.value = '';
    input.value?.focus();
  }
}
</script>

<template>
  <form class="composer" @submit.prevent="onSubmit">
    <label for="new-todo" class="visually-hidden">Nouvelle tâche</label>
    <input
      id="new-todo"
      ref="input"
      v-model="title"
      class="composer__input"
      type="text"
      placeholder="Ajouter une tâche"
      autocomplete="off"
      :maxlength="TITLE_MAX_LENGTH"
    />
    <span
      v-if="charsLeft <= 40"
      class="composer__count"
      :class="{ 'is-low': charsLeft <= 10 }"
      :title="`${charsLeft} caractères restants`"
    >
      {{ charsLeft }}
    </span>
    <button class="composer__submit" type="submit" :disabled="!trimmed || pending">Ajouter</button>
  </form>
</template>
