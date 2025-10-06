-- Create urls table to store shortened URLs
CREATE TABLE IF NOT EXISTS urls (
  id SERIAL PRIMARY KEY,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Create clicks table to track analytics
CREATE TABLE IF NOT EXISTS clicks (
  id SERIAL PRIMARY KEY,
  url_id INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  country VARCHAR(2),
  city VARCHAR(100),
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_url_id ON clicks(url_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_url_id_clicked_at ON clicks(url_id, clicked_at DESC);
