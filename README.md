# Cyber News Hub

A web application for aggregating and displaying cybersecurity news from various RSS feeds. Built with Vue.js, Express, and Supabase.

## Features

- 🔒 User authentication
- 📰 RSS feed aggregation
- 🌓 Dark/light mode
- 🔍 Search and filtering
- 🏷️ Keyword-based filtering
- 📱 Responsive design
- 🔄 Auto-refresh functionality
- 🗑️ Automatic cleanup of old news

## Tech Stack

- Frontend: Vue 3 + Vite + Tailwind CSS
- Backend: Express.js
- Database: Supabase
- Authentication: Supabase Auth
- RSS Parsing: rss-parser

## Setup

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/woolf31/cyber-news-hub.git
   cd cyber-news-hub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy the SQL from `supabase/schema.sql` and run it in the SQL editor
   - Copy your project URL and anon key

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   For local development, use these settings:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-key
   NODE_ENV=development
   VITE_API_URL=http://localhost:5000
   VITE_APP_URL=http://localhost:5173
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Vercel Deployment

1. Push your code to GitHub

2. Create a new project on Vercel:
   - Connect your GitHub repository
   - Set the Framework Preset to "Other"
   - Set the Build Command to `npm run vercel-build`
   - Set the Output Directory to `dist`

3. Configure environment variables in Vercel:
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.example`
   - Set `VITE_APP_URL` and `VITE_API_URL` to your Vercel domain
   - Set `NODE_ENV` to `production`

4. Deploy:
   - Vercel will automatically deploy when you push to your main branch
   - You can also manually deploy from the Vercel dashboard

5. After deployment:
   - Update your Supabase project settings to allow your Vercel domain
   - Test the application thoroughly

## Environment Variables

### Required Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_APP_URL`: Your application URL (Vercel domain in production)
- `VITE_API_URL`: Your API URL (same as APP_URL in production)
- `NODE_ENV`: Environment (`development` or `production`)

### Development Variables
- `PORT`: Server port (default: 5000) - only needed for local development

## Development

The application runs two servers:
- Frontend: Vite dev server (default: http://localhost:5173)
- Backend: Express server (default: http://localhost:5000)

## Recommended RSS Feeds

Check `recommended-feeds.txt` for a list of curated cybersecurity news feeds you can add to the application.

## Features

### Authentication
- Email/password signup and login
- Protected API endpoints
- Persistent sessions

### News Management
- Add/remove RSS feeds
- Automatic news fetching
- Week-old news cleanup
- Search and filtering capabilities

### UI Features
- Dark/light mode with system preference detection
- Responsive layout
- Loading states and error handling
- User-friendly notifications

## License

MIT
