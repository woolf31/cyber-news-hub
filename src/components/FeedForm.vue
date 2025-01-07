<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add RSS Feed</h2>
    
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="feedUrl" class="block text-sm text-gray-600 dark:text-gray-400 mb-1">
          RSS Feed URL
        </label>
        <input
          id="feedUrl"
          v-model="feedUrl"
          type="url"
          required
          placeholder="https://example.com/feed.xml"
          class="input"
          :disabled="loading"
        />
      </div>

      <div class="flex items-center justify-between">
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="loading"
        >
          <span v-if="loading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Adding...
          </span>
          <span v-else>Add Feed</span>
        </button>

        <button
          type="button"
          @click="refreshFeeds"
          class="btn bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          :disabled="refreshing"
        >
          <span v-if="refreshing" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Refreshing...
          </span>
          <span v-else>Refresh All</span>
        </button>
      </div>

      <!-- Status messages -->
      <div v-if="status" :class="[
        'p-3 rounded-lg text-sm flex items-center',
        {
          'bg-red-50 text-red-600 dark:bg-red-900/50 dark:text-red-400': status.type === 'error',
          'bg-green-50 text-green-600 dark:bg-green-900/50 dark:text-green-400': status.type === 'success',
          'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400': status.type === 'info',
          'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400': status.type === 'warning'
        }
      ]">
        <!-- Status icons -->
        <svg v-if="status.type === 'error'" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-if="status.type === 'success'" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-if="status.type === 'info'" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-if="status.type === 'warning'" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        {{ status.message }}
      </div>
    </form>

    <!-- Existing feeds list -->
    <div class="mt-8">
      <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Current Feeds</h3>
      <ul class="space-y-2">
        <li 
          v-for="feed in feeds" 
          :key="feed.id"
          class="flex items-center justify-between text-sm"
        >
          <span class="text-gray-700 dark:text-gray-300">{{ feed.name }}</span>
          <button
            @click="deleteFeed(feed.id)"
            class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Remove
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../lib/api';

const emit = defineEmits(['feedAdded']);

const feedUrl = ref('');
const loading = ref(false);
const refreshing = ref(false);
const status = ref(null);
const feeds = ref([]);

// Fetch existing feeds
const fetchFeeds = async () => {
  try {
    feeds.value = await api.getFeeds();
  } catch (error) {
    status.value = {
      type: 'error',
      message: 'Failed to load feeds: ' + error.message
    };
  }
};

// Add new feed
const handleSubmit = async () => {
  try {
    loading.value = true;
    status.value = null;

    // Validate URL format
    try {
      new URL(feedUrl.value);
    } catch (e) {
      throw new Error('Please enter a valid URL');
    }

    status.value = {
      type: 'info',
      message: 'Validating feed...'
    };

    const newFeed = await api.addFeed(feedUrl.value);
    feeds.value.unshift(newFeed);
    feedUrl.value = '';
    
    status.value = {
      type: 'success',
      message: 'Feed added successfully. Fetching initial news...'
    };

    // Fetch news from the new feed
    try {
      await api.refreshNews();
      status.value = {
        type: 'success',
        message: 'Feed added and news fetched successfully'
      };
      emit('feedAdded');
    } catch (refreshError) {
      console.error('Error fetching initial news:', refreshError);
      status.value = {
        type: 'warning',
        message: 'Feed added but failed to fetch initial news. Will retry automatically.'
      };
    }
  } catch (error) {
    console.error('Error adding feed:', error);
    status.value = {
      type: 'error',
      message: error.message || 'Failed to add feed. Please try again.'
    };
  } finally {
    loading.value = false;
  }
};

// Refresh all feeds
const refreshFeeds = async () => {
  try {
    refreshing.value = true;
    status.value = {
      type: 'info',
      message: 'Refreshing feeds...'
    };

    const result = await api.refreshNews();
    console.log('Refresh result:', result);

    status.value = {
      type: 'success',
      message: `Feeds refreshed successfully. Processed ${result.stats.processed} items, added ${result.stats.inserted} new items.`
    };
    emit('feedAdded');
  } catch (error) {
    console.error('Error refreshing feeds:', error);
    status.value = {
      type: 'error',
      message: 'Failed to refresh feeds: ' + (error.message || 'Unknown error')
    };
  } finally {
    refreshing.value = false;
  }
};

// Delete feed
const deleteFeed = async (id) => {
  try {
    await api.deleteFeed(id);

    feeds.value = feeds.value.filter(feed => feed.id !== id);
    status.value = {
      type: 'success',
      message: 'Feed deleted successfully'
    };
  } catch (error) {
    status.value = {
      type: 'error',
      message: 'Failed to delete feed: ' + error.message
    };
  }
};

onMounted(fetchFeeds);
</script>
