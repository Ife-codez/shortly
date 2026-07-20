const { customAlphabet } = require('nanoid');

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generateSlug = customAlphabet(alphabet, 7);

async function slugExists(pool, slug) {
  const result = await pool.query('SELECT 1 FROM links WHERE slug = $1', [slug]);
  return result.rows.length > 0;
}

module.exports = { generateSlug, slugExists };