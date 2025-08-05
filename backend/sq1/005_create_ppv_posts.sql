-- 005_create_ppv_posts.sql

CREATE TABLE posts (
  id           SERIAL PRIMARY KEY,
  creator_id   INTEGER    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT       NOT NULL,
  description  TEXT       NULL,
  file_path    TEXT       NOT NULL,
  price_cents  INTEGER    NOT NULL DEFAULT 0,
  created_at   TIMESTAMP  DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchases (
  id           SERIAL PRIMARY KEY,
  post_id      INTEGER    NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  buyer_id     INTEGER    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_cents INTEGER    NOT NULL,
  created_at   TIMESTAMP  DEFAULT CURRENT_TIMESTAMP
);
