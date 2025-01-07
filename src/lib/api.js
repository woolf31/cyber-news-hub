import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : window.location.origin);

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  };
};

export const api = {
  async getFeeds() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/feeds`, { headers });
    if (!response.ok) throw new Error('Failed to fetch feeds');
    return response.json();
  },

  async addFeed(url) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/feeds`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add feed');
    }
    return response.json();
  },

  async deleteFeed(id) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/feeds/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete feed');
    return response.json();
  },

  async getNews() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/news`, { headers });
    if (!response.ok) throw new Error('Failed to fetch news');
    return response.json();
  },

  async refreshNews() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/fetch-news`, {
      method: 'POST',
      headers,
    });
    if (!response.ok) throw new Error('Failed to refresh news');
    return response.json();
  },
};
