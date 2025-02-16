<template>
  <div class="space-y-4">
    <!-- Debug info -->
    <!-- <div v-if="debug" class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 text-sm">
      <p>Total news items: {{ news.length }}</p>
      <p>Filtered items: {{ filteredNews.length }}</p>
      <p>Visible items: {{ visibleNews.length }}</p>
      <p>Current page: {{ currentPage }}</p>
      <p>Loading: {{ loading }}</p>
      <p>Error: {{ error }}</p>
      <p>Search: {{ search }}</p>
      <p>Sort by: {{ sortBy }}</p>
      <p>Selected keywords: {{ selectedKeywords.join(', ') }}</p>
    </div> -->

    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading news...</span>
    </div>
    
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/50 p-4 rounded-lg">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
      <button 
        @click="fetchNews" 
        class="mt-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
      >
        Try again
      </button>
    </div>

    <div v-else-if="filteredNews.length === 0" class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
      <p class="text-gray-600 dark:text-gray-400">
        {{ news.length === 0 ? 'No news articles found. Try adding some RSS feeds.' : 'No articles match your filters.' }}
      </p>
    </div>

    <div v-else>
      <div ref="container" class="space-y-4" @scroll="handleScroll">
        <div v-for="item in visibleNews" :key="item.id">
          <NewsItem :item="item" :debug="debug" />
        </div>
        
        <div v-if="hasMorePages" class="text-center py-4">
          <button 
            @click="loadMore"
            class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Load more
          </button>
        </div>
      </div>
    </div>

    <!-- Refresh button -->
    <div v-if="!loading && !error && news.length > 0" class="fixed bottom-4 right-4">
      <button
        @click="fetchNews"
        class="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Refresh news"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, watchEffect } from 'vue';
import { useStorage } from '@vueuse/core';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import NewsItem from './NewsItem.vue';

// Enable debug mode in development
const debug = ref(process.env.NODE_ENV === 'development');

const props = defineProps({
  search: {
    type: String,
    default: ''
  },
  sortBy: {
    type: String,
    default: 'date'
  },
  selectedKeywords: {
    type: Array,
    default: () => []
  }
});

const news = ref([]);
const loading = ref(true);
const error = ref(null);
const container = ref(null);

// Store last refresh time
const lastRefresh = useStorage('cyber-news-last-refresh', 0);

// Calculate relevance score for search
const calculateRelevance = (item, searchTerms) => {
  let score = 0;
  const content = `${item.title} ${item.description}`.toLowerCase();
  
  searchTerms.forEach(term => {
    // Title matches worth more
    const titleMatches = (item.title.toLowerCase().match(new RegExp(term, 'g')) || []).length;
    score += titleMatches * 3;
    
    // Description matches
    const descMatches = (item.description.toLowerCase().match(new RegExp(term, 'g')) || []).length;
    score += descMatches;
  });
  
  return score;
};

// Filter and sort news
const filteredNews = computed(() => {
  let filtered = [...(news.value || [])];

  // Apply search filter
  if (props.search.trim()) {
    const searchTerms = props.search.toLowerCase().split(/\s+/).filter(Boolean);
    filtered = filtered.filter(item => {
      const content = `${item.title} ${item.description}`.toLowerCase();
      return searchTerms.every(term => content.includes(term));
    });
    
    // Add relevance scores
    filtered.forEach(item => {
      item.relevance = calculateRelevance(item, searchTerms);
    });
  }

  // Apply keyword filters
  if (props.selectedKeywords.length > 0) {
    filtered = filtered.filter(item => {
      const content = `${item.title} ${item.description}`.toLowerCase();
      return props.selectedKeywords.every(keyword => 
        content.includes(keyword.toLowerCase())
      );
    });
  }

  // Apply sorting
  switch (props.sortBy) {
    case 'date':
      filtered.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
      break;
    case 'date-asc':
      filtered.sort((a, b) => new Date(a.published_at) - new Date(b.published_at));
      break;
    case 'source':
      filtered.sort((a, b) => a.source.localeCompare(b.source));
      break;
    case 'relevance':
      if (props.search.trim()) {
        filtered.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
      }
      break;
  }

  return filtered;
});

// Pagination setup
const PAGE_SIZE = 10;
const currentPage = ref(0);

const visibleNews = computed(() => {
  const start = 0;
  const end = (currentPage.value + 1) * PAGE_SIZE;
  return filteredNews.value.slice(start, end);
});

const hasMorePages = computed(() => {
  return (currentPage.value + 1) * PAGE_SIZE < filteredNews.value.length;
});

const loadMore = () => {
  if (hasMorePages.value) {
    currentPage.value++;
  }
};

// Fetch news from API
const fetchNews = async () => {
  try {
    loading.value = true;
    error.value = null;
    console.log('Fetching news...');
    const data = await api.getNews();
    console.log('Fetched news:', data);
    news.value = Array.isArray(data) ? data : [];
    if (news.value.length === 0) {
      console.log('No news items found');
    }
    currentPage.value = 0; // Reset pagination on new data
  } catch (err) {
    console.error('Error fetching news:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Auto-refresh setup
const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
let refreshInterval;

// Initial fetch and refresh setup
onMounted(async () => {
  console.log('NewsContainer mounted');
  
  // Check if we need to refresh (older than 30 minutes)
  const now = Date.now();
  if (now - lastRefresh.value > REFRESH_INTERVAL) {
    try {
      await api.refreshNews();
    } catch (err) {
      console.error('Initial refresh failed:', err);
    }
  }
  
  await fetchNews();
  window.addEventListener('refresh-news', fetchNews);
  
  // Set up auto-refresh
  refreshInterval = setInterval(async () => {
    console.log('Auto-refreshing news...');
    try {
      const result = await api.refreshNews();
      console.log('Refresh result:', result);
      lastRefresh.value = Date.now();
      await fetchNews();
    } catch (err) {
      console.error('Auto-refresh failed:', err);
    }
  }, REFRESH_INTERVAL);
});

// Clean up
onUnmounted(() => {
  window.removeEventListener('refresh-news', fetchNews);
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// Watch for user changes to refetch news
watchEffect(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    fetchNews().catch(err => {
      console.error('Failed to fetch news:', err);
      error.value = 'Failed to fetch news. Please try again later.';
    });
  }
});

// Watch for filter changes to reset pagination
watch([() => props.search, () => props.sortBy, () => props.selectedKeywords], () => {
  currentPage.value = 0;
  if (container.value) {
    container.value.scrollTop = 0;
  }
});
</script>
