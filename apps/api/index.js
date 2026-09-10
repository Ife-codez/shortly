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
   const slug = await generateUniqueSlug(pool);

   const result = await pool.query(
    `INSERT INTO links (slug, original_url, custom)
     VALUES ($1, $2, $3)
     RETURNING id, slug, original_url, created_at`,
    [slug, url, false]
  );
 res.status(201).json(result.rows[0]);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
