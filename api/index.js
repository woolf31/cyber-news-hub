import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import { proxyFeed } from '../server/proxy.js';
import { authMiddleware } from '../server/middleware/auth.js';

dotenv.config();

const app = express();
const parser = new Parser();

// Supabase client initialization
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.VITE_APP_URL || 'https://cyber-news-hub.vercel.app']
    : 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
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

app.post('/api/feeds', authMiddleware, async (req, res) => {
  try {
    const { url } = req.body;
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

app.get('/api/news', authMiddleware, async (req, res) => {
  try {
    const { data: news, error } = await supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fetch-news', authMiddleware, async (req, res) => {
  try {
    const { data: feeds } = await supabase
      .from('feeds')
      .select('*');

    let totalProcessed = 0;
    let totalInserted = 0;

    for (const feed of feeds) {
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

          const { error, data } = await supabase
            .from('news')
            .upsert([newsItem], {
              onConflict: 'link',
              ignoreDuplicates: true
            })
            .select();

          if (data?.length > 0) totalInserted++;
        }
      } catch (error) {
        console.error(`Error processing feed ${feed.name}:`, error);
      }
    }

    // Delete old news
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { error: deleteError, count: deletedCount } = await supabase
      .from('news')
      .delete()
      .lt('published_at', sevenDaysAgo.toISOString())
      .select('count');

    res.json({
      message: 'News updated successfully',
      stats: {
        processed: totalProcessed,
        inserted: totalInserted,
        deleted: deletedCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export for Vercel serverless function
export default app;
