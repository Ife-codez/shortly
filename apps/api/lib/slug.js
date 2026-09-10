const { customAlphabet } = require('nanoid');

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generateSlug = customAlphabet(alphabet, 7);

async function slugExists(pool, slug) {
  const result = await pool.query('SELECT 1 FROM links WHERE slug = $1', [slug]);
  return result.rows.length > 0;
}
async function generateUniqueSlug(pool) {
  const MAX_ATTEMPTS = 5;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = exports.generateSlug();
    const alreadyTaken = await slugExists(pool, candidate);

    if (!alreadyTaken) {
      return candidate;
    }
  }

  throw new Error('Could not generate a unique slug after multiple attempts');
}
exports.generateSlug = generateSlug;
exports.slugExists = slugExists;
exports.generateUniqueSlug = generateUniqueSlug;