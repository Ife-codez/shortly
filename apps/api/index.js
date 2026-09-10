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
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  }

  console.error('Failed to create link after multiple slug collision retries');
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
