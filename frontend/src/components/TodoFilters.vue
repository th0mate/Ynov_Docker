<script setup lang="ts">
import type { Filter } from '../types';

defineProps<{
  modelValue: Filter;
  counts: Record<Filter, number>;
}>();

const emit = defineEmits<{ 'update:modelValue': [filter: Filter] }>();

const options: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'active', label: 'À faire' },
  { value: 'completed', label: 'Terminées' },
];
</script>

<template>
  <nav class="filters" aria-label="Filtrer les tâches">
    <button
      v-for="option in options"
      :key="option.value"
      class="filters__tab"
      type="button"
      :aria-pressed="modelValue === option.value"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
      <span class="filters__count">{{ counts[option.value] }}</span>
    </button>
  </nav>
</template>
