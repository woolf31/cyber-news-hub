import axios from 'axios';

export const proxyFeed = async (url) => {
  try {
    console.log(`Proxying feed request to: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000, // 10 second timeout
      validateStatus: status => status === 200 // Only accept 200 status
    });
    
    if (!response.data) {
      throw new Error('Empty response from feed');
    }

    // Check if response is XML/RSS
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('xml') && !response.data.includes('<rss')) {
      throw new Error('Invalid feed format: Not an RSS feed');
    }

    console.log(`Successfully fetched feed: ${url}`);
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Feed request timed out: ${url}`);
    }
    if (error.response) {
      throw new Error(`Feed request failed with status ${error.response.status}: ${url}`);
    }
    throw new Error(`Failed to fetch feed: ${error.message}`);
  }
};
