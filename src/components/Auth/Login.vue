<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          {{ isSignUp ? 'Create your account' : 'Sign in to your account' }}
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              required
              v-model="email"
              class="input"
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              v-model="password"
              class="input"
              placeholder="Password"
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="text-sm">
            <button
              type="button"
              @click="isSignUp = !isSignUp"
              class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {{ isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up' }}
            </button>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="btn btn-primary w-full flex justify-center"
          >
            <svg
              v-if="loading"
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ isSignUp ? 'Sign up' : 'Sign in' }}
          </button>
        </div>

        <!-- Error message -->
        <div
          v-if="error"
          class="bg-red-50 dark:bg-red-900/50 p-4 rounded-md"
        >
          <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '../../lib/supabase';

const emit = defineEmits(['auth-complete']);

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref(null);
const isSignUp = ref(false);

const handleSubmit = async () => {
  try {
    loading.value = true;
    error.value = null;

    const { data, error: authError } = isSignUp.value
      ? await supabase.auth.signUp({
          email: email.value,
          password: password.value,
        })
      : await supabase.auth.signInWithPassword({
          email: email.value,
          password: password.value,
        });

    if (authError) throw authError;

    if (isSignUp.value && data?.user?.identities?.length === 0) {
      error.value = 'Email already registered';
      return;
    }

    emit('auth-complete', data.user);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>
