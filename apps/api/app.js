const express = require('express');
const { Pool } = require('pg');
const { createClient } = require('redis');
const { validateUrl } = require('./lib/validateUrl');
const { generateUniqueSlug } = require('./lib/slug');
const bcrypt = require('bcrypt');
const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const jwt = require('jsonwebtoken');
const { requireAuth } = require('./middleware/auth');

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.connect();

app.use(express.json());
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'yes' });
});

app.post('/links', requireAuth, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  const validation = validateUrl(url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  const MAX_INSERT_ATTEMPTS = 3;
  for (let attempt = 0; attempt < MAX_INSERT_ATTEMPTS; attempt++) {
    try {
      const slug = await generateUniqueSlug(pool);

      const result = await pool.query(
        `INSERT INTO links (slug, original_url, custom, user_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, slug, original_url, created_at`,
        [slug, url, false, req.userId]
      );

      return res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        // unique_violation on slug — another request grabbed it first, retry
        continue;
      }
      console.error('Error creating link:', err);
      return res
        .status(500)
        .json({ error: 'Something went wrong. Please try again.' });
    }
  }

  console.error('Failed to create link after multiple slug collision retries');
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    let cached = null
    try {
      cached = await redisClient.get(`slug:${slug}`);
    } catch (err) {
      console.error('Redis unavailable, falling back to database:', err);
    }

    let linkId, original_url;

    if (cached) {
      ({ id: linkId, original_url } = JSON.parse(cached));
    } else {
      const result = await pool.query('SELECT id, original_url FROM links WHERE slug = $1', [slug]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Link not found' });
      }

      ({ id: linkId, original_url } = result.rows[0]);

      try {
        await redisClient.set(`slug:${slug}`, JSON.stringify({ id: linkId, original_url }));
      } catch (err) {
        console.error('Failed to populate cache:', err);
      }
    }

    res.redirect(302, original_url);

    pool.query(
      `INSERT INTO click_events (link_id, referrer, user_agent, ip_address)
        VALUES ($1, $2, $3, $4)`,
      [linkId, req.get('referrer') || null, req.get('user-agent') || null, req.ip]
    ).catch((err) => {
      console.error('Failed to record click:', err);
    });
  } catch (err) {
    console.error('Error resolving redirect:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
      [email, passwordHash]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

app.post('/auth/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const result = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { id: userId, password_hash } = result.rows[0];

    const passwordMatches = await bcrypt.compare(password, password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ token });
  } catch (err) {
    console.error('Error signing in:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

app.get('/links/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT id, slug, original_url, user_id, created_at FROM links WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const link = result.rows[0];

    if (link.user_id !== req.userId) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.status(200).json(link);
  } catch (err) {
    console.error('Error fetching link:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// DELETE /links/:slug intentionally removed for now.
// Anyone who knows a slug could delete it with no ownership check,
// since authentication doesn't exist yet. Will be re-added
// once a link's owner can be verified against the authenticated user.
module.exports = { app, pool, redisClient };