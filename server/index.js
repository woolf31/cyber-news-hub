import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import { proxyFeed } from './proxy.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();
const parser = new Parser();
const port = process.env.PORT || 5000;

// Supabase client initialization
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

// Public routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Protected routes
app.get('/api/feeds', authMiddleware, async (req, res) => {
  try {
    const { data: feeds, error } = await supabase
      .from('feeds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(feeds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new feed
app.post('/api/feeds', authMiddleware, async (req, res) => {
  try {
    const { url } = req.body;
    // Validate RSS feed using proxy
    const feedData = await proxyFeed(url);
    const feed = await parser.parseString(feedData);
    
    const { data, error } = await supabase
      .from('feeds')
      .insert([{ url, name: feed.title }])
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete feed
app.delete('/api/feeds/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('feeds')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Feed deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all news items
app.get('/api/news', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching all news items...');
    const { data: news, error } = await supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(100); // Limit to latest 100 items for better performance

    if (error) {
      console.error('Error fetching news:', error);
      throw error;
    }

    const newsItems = news || [];
    console.log(`Found ${newsItems.length} news items`);

    // Add debug info for first few items
    if (newsItems.length > 0) {
      console.log('Sample news items:');
      newsItems.slice(0, 3).forEach(item => {
        console.log(`- ${item.title} (${item.source}) - ${item.published_at}`);
      });
    }

    res.json(newsItems);
  } catch (error) {
    console.error('Error in /api/news:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch and update news from all feeds
app.post('/api/fetch-news', authMiddleware, async (req, res) => {
  console.log('Starting news fetch process...');
  try {
    console.log('Fetching feeds...');
    const { data: feeds, error: feedError } = await supabase
      .from('feeds')
      .select('*')
      .order('created_at', { ascending: false });

    if (feedError) {
      console.error('Error fetching feeds:', feedError);
      throw feedError;
    }

    console.log(`Found ${feeds?.length || 0} feeds to process`);

    let totalProcessed = 0;
    let totalInserted = 0;

    if (!feeds || feeds.length === 0) {
      console.log('No feeds found to process');
      return res.json({
        message: 'No feeds to process',
        stats: { processed: 0, inserted: 0, deleted: 0 }
      });
    }

    for (const feed of feeds) {
      console.log(`Processing feed: ${feed.name} (${feed.url})`);
      try {
        const feedData = await proxyFeed(feed.url);
        const parsedFeed = await parser.parseString(feedData);
        
        for (const item of parsedFeed.items) {
          totalProcessed++;
          const newsItem = {
            title: item.title,
            link: item.link,
            description: item.contentSnippet || item.content,
            published_at: new Date(item.pubDate).toISOString(),
            feed_id: feed.id,
            source: feed.name
          };

          // Check if item already exists
          const { data: existing } = await supabase
            .from('news')
            .select('id')
            .eq('link', item.link)
            .maybeSingle();

          if (existing) {
            console.log(`Skipping existing item: ${item.title}`);
            continue;
          }

          console.log(`Inserting new item: ${item.title}`);
          const { error, data } = await supabase
            .from('news')
            .insert([newsItem])
            .select();

          if (error) {
            console.error(`Error inserting news item: ${error.message}`);
            continue;
          }

          if (data && data.length > 0) {
            totalInserted++;
          }
        }
      } catch (error) {
        console.error(`Error processing feed ${feed.name}: ${error.message}`);
        continue;
      }
    }

    console.log(`Completed processing. Processed ${totalProcessed} items, inserted ${totalInserted} new items`);

    // Delete old news (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    console.log('Cleaning up old news...');
    const { error: deleteError, count: deletedCount } = await supabase
      .from('news')
      .delete()
      .lt('published_at', sevenDaysAgo.toISOString())
      .select('count');

    if (deleteError) {
      console.error(`Error deleting old news: ${deleteError.message}`);
      throw deleteError;
    }

    console.log(`Deleted ${deletedCount} old news items`);

    res.json({
      message: 'News updated successfully',
      stats: {
        processed: totalProcessed,
        inserted: totalInserted,
        deleted: deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
