<template>
  <article class="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
    <div class="space-y-2">
      <!-- Debug info -->
      <!-- <div v-if="!item" class="text-red-500">No item data provided</div>
      <pre v-if="debug" class="text-xs text-gray-500 overflow-auto">{{ JSON.stringify(item, null, 2) }}</pre> -->

      <template v-if="item">
        <div class="flex justify-between items-start">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            <a 
              :href="item.link" 
              target="_blank" 
              rel="noopener noreferrer"
              class="hover:text-blue-600 dark:hover:text-blue-400"
            >
              {{ item.title || 'Untitled' }}
            </a>
          </h2>
          <span 
            class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4"
            :title="formatDate(item.published_at, true)"
          >
            {{ formatDate(item.published_at) }}
          </span>
        </div>

        <p class="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
          {{ stripHtml(item.description || 'No description available') }}
        </p>

        <div class="flex justify-between items-center pt-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {{ item.source || 'Unknown Source' }}
          </span>
          
          <a 
            :href="item.link" 
            target="_blank" 
            rel="noopener noreferrer"
            class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Read more →
          </a>
        </div>
      </template>
    </div>
  </article>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  debug: {
    type: Boolean,
    default: false
  }
});

const formatDate = (dateString, full = false) => {
  if (!dateString) return 'Unknown date';
  
  try {
    const date = new Date(dateString);
    if (full) {
      return date.toLocaleString();
    }
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid date';
  }
};

const stripHtml = (html) => {
  if (!html) return '';
  try {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  } catch (e) {
    console.error('Error stripping HTML:', e);
    return html;
  }
};
</script>
