-- Create feeds table
CREATE TABLE feeds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create news table
CREATE TABLE news (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    link TEXT NOT NULL UNIQUE,
    description TEXT,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    feed_id UUID REFERENCES feeds(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create unique index on link to ensure no duplicate news items
CREATE UNIQUE INDEX idx_news_link ON news(link);

-- Create index for faster querying
CREATE INDEX idx_news_published_at ON news(published_at DESC);
CREATE INDEX idx_news_feed_id ON news(feed_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_feeds_updated_at
    BEFORE UPDATE ON feeds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on feeds"
    ON feeds FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access on news"
    ON news FOR SELECT
    USING (true);

-- Allow public insert and delete for feeds
CREATE POLICY "Allow public insert on feeds"
    ON feeds FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public delete on feeds"
    ON feeds FOR DELETE
    USING (true);

-- Allow unrestricted operations on news
CREATE POLICY "Allow all operations on news"
    ON news
    USING (true)
    WITH CHECK (true);

-- Enable realtime for news table
ALTER PUBLICATION supabase_realtime ADD TABLE news;
