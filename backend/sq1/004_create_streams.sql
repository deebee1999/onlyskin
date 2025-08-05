CREATE TABLE streams (
  id          SERIAL PRIMARY KEY,
  creator_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(150) NOT NULL,
  stream_key  TEXT    NOT NULL,            -- you’ll use this to identify the HLS/RTMP room
  is_live     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
