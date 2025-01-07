<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
    <div class="space-y-4">
      <!-- Search input -->
      <div>
        <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">
          Search in title and description:
        </label>
        <div class="relative">
          <input
            type="text"
            :value="search"
            @input="$emit('update:search', $event.target.value)"
            placeholder="Search news"
            class="input pl-10"
          />
          <svg
            class="absolute left-3 top-3 h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Separate multiple terms with spaces
        </p>
      </div>

      <!-- Sort options -->
      <div class="flex items-center space-x-4">
        <label class="text-sm text-gray-600 dark:text-gray-400">Sort by:</label>
        <select
          :value="sortBy"
          @change="$emit('update:sortBy', $event.target.value)"
          class="input !w-auto"
        >
          <option value="date">Date (newest first)</option>
          <option value="date-asc">Date (oldest first)</option>
          <option value="source">Source</option>
          <option value="relevance">Relevance</option>
        </select>
      </div>

      <!-- Keywords -->
      <div>
        <label class="block text-sm text-gray-600 dark:text-gray-400 mb-2">
          Filter by keywords:
        </label>
        <div class="flex flex-wrap gap-2 mb-2">
          <button
            v-for="keyword in keywords"
            :key="keyword"
            @click="$emit('keywordSelect', keyword)"
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200',
              isSelected(keyword)
                ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            ]"
          >
            {{ keyword }}
          </button>
        </div>

        <!-- Custom keyword input -->
        <div class="flex gap-2">
          <input
            v-model="newKeyword"
            type="text"
            placeholder="Add custom keyword..."
            class="input flex-1"
            @keyup.enter="addCustomKeyword"
          />
          <button
            @click="addCustomKeyword"
            class="btn btn-primary"
            :disabled="!newKeyword.trim()"
          >
            Add
          </button>
        </div>
      </div>

      <!-- Active filters -->
      <div v-if="hasActiveFilters" class="border-t dark:border-gray-700 pt-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
          <button
            @click="clearFilters"
            class="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Clear all
          </button>
        </div>
        <div class="mt-2 flex flex-wrap gap-2">
          <span
            v-for="keyword in selectedKeywords"
            :key="keyword"
            class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            {{ keyword }}
            <button
              @click="$emit('keywordSelect', keyword)"
              class="hover:text-blue-600 dark:hover:text-blue-300"
            >
              ×
            </button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
import { useStorage } from '@vueuse/core';

const props = defineProps({
  search: {
    type: String,
    required: true
  },
  sortBy: {
    type: String,
    required: true
  },
  keywords: {
    type: Array,
    required: true
  },
  selectedKeywords: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:search', 'update:sortBy', 'keywordSelect', 'addCustomKeyword']);

// Custom keywords storage
const customKeywords = useStorage('cyber-news-custom-keywords', []);
const newKeyword = ref('');

const addCustomKeyword = () => {
  const keyword = newKeyword.value.trim().toLowerCase();
  if (keyword) {
    emit('addCustomKeyword', keyword);
    newKeyword.value = '';
  }
};

const isSelected = (keyword) => {
  return props.selectedKeywords.includes(keyword);
};

const hasActiveFilters = computed(() => {
  return props.selectedKeywords.length > 0 || props.search.trim().length > 0;
});

const clearFilters = () => {
  props.selectedKeywords.forEach(keyword => {
    emit('keywordSelect', keyword);
  });
  emit('update:search', '');
};
</script>
