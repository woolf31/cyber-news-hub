<template>
  <Login v-if="!user" @auth-complete="handleAuthComplete" />
  
  <div v-else class="min-h-screen">
    <header class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Cyber News Hub</h1>
          <div class="flex items-center space-x-4">
            <button
              @click="toggleDarkMode"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            >
            <svg
              v-if="isDark"
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
            </button>

            <!-- User menu -->
            <div class="relative">
              <button
                @click="showUserMenu = !showUserMenu"
                class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ user.email }}</span>
                <svg
                  class="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>

              <!-- Dropdown menu -->
              <div
                v-if="showUserMenu"
                class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5"
              >
                <div
                  class="py-1"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu"
                >
                  <button
                    @click="handleLogout"
                    class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div class="lg:col-span-3">
          <SearchFilter
            v-model:search="searchQuery"
            v-model:sortBy="sortBy"
            :keywords="keywords"
            :selectedKeywords="selectedKeywords"
            @keywordSelect="toggleKeyword"
          />
          <NewsContainer
            :search="searchQuery"
            :sortBy="sortBy"
            :selectedKeywords="selectedKeywords"
          />
        </div>
        <div class="lg:col-span-1">
          <FeedForm @feedAdded="refreshNews" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useStorage } from '@vueuse/core';
import { supabase } from './lib/supabase';
import NewsContainer from './components/NewsContainer.vue';
import FeedForm from './components/FeedForm.vue';
import SearchFilter from './components/SearchFilter.vue';
import Login from './components/Auth/Login.vue';

const user = ref(null);
const showUserMenu = ref(false);
const isDark = useStorage('cyber-news-dark-mode', false);
const searchQuery = ref('');
const sortBy = ref('date');
const keywords = ref(['cybersecurity', 'malware', 'ransomware', 'privacy', 'data breach']);
const selectedKeywords = ref([]);

// Handle click outside user menu
const handleClickOutside = (event) => {
  const menu = document.querySelector('#user-menu');
  if (menu && !menu.contains(event.target)) {
    showUserMenu.value = false;
  }
};

onMounted(async () => {
  // Check for existing session
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    user.value = session.user;
  }

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null;
  });

  // Apply dark mode on initial load
  if (isDark.value) {
    document.documentElement.classList.add('dark');
  }

  // Add click outside listener
  document.addEventListener('click', handleClickOutside);

  // Cleanup subscription
  onUnmounted(() => {
    subscription.unsubscribe();
    document.removeEventListener('click', handleClickOutside);
  });
});

const handleAuthComplete = (userData) => {
  user.value = userData;
};

const handleLogout = async () => {
  await supabase.auth.signOut();
  user.value = null;
};

const toggleDarkMode = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark');
};

const toggleKeyword = (keyword) => {
  const index = selectedKeywords.value.indexOf(keyword);
  if (index === -1) {
    selectedKeywords.value.push(keyword);
  } else {
    selectedKeywords.value.splice(index, 1);
  }
};

const refreshNews = () => {
  // Emit event to refresh news list
  window.dispatchEvent(new CustomEvent('refresh-news'));
};
</script>
