<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
    <div class="space-y-4">
      <!-- Search input -->
      <div>
        <div class="relative">
          <input
            type="text"
            :value="search"
            @input="$emit('update:search', $event.target.value)"
            placeholder="Search news..."
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
      </div>

      <!-- Sort options -->
      <div class="flex items-center space-x-4">
        <label class="text-sm text-gray-600 dark:text-gray-400">Sort by:</label>
        <select
          :value="sortBy"
          @change="$emit('update:sortBy', $event.target.value)"
          class="input !w-auto"
        >
          <option value="date">Date</option>
          <option value="source">Source</option>
        </select>
      </div>

      <!-- Keywords -->
      <div>
        <label class="block text-sm text-gray-600 dark:text-gray-400 mb-2">
          Filter by keywords:
        </label>
        <div class="flex flex-wrap gap-2">
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

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

defineEmits(['update:search', 'update:sortBy', 'keywordSelect']);

const isSelected = (keyword) => {
  return props.selectedKeywords.includes(keyword);
};
</script>
