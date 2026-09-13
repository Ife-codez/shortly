const express = require('express');
const { Pool } = require('pg');
const { validateUrl } = require('./lib/validateUrl');
const { generateUniqueSlug } = require('./lib/slug');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
app.use(express.json());
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'yes' });
});

app.post('/links', async (req, res) => {
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
        `INSERT INTO links (slug, original_url, custom)
         VALUES ($1, $2, $3)
         RETURNING id, slug, original_url, created_at`,
        [slug, url, false]
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

  const result = await pool.query('SELECT id, original_url FROM links WHERE slug = $1', [slug]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const { id: linkId, original_url } = result.rows[0];
  res.redirect(302, original_url);
  pool.query(
    `INSERT INTO click_events (link_id, referrer, user_agent, ip_address)
      VALUES ($1, $2, $3, $4)`,
    [linkId, req.get('referrer') || null, req.get('user-agent') || null, req.ip]
  ).catch((err) => {
    console.error('Failed to record click:', err);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
