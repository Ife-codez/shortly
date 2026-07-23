const { Pool } = require('pg');
const { generateSlug, slugExists, generateUniqueSlug } = require('./slug');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

afterAll(async () => {
  await pool.end();
});

test('generateSlug produces a 7-character string', () => {
  const slug = generateSlug();
  expect(slug.length).toBe(7);
});

test('generateSlug produces different values on repeated calls', () => {
  const first = generateSlug();
  const second = generateSlug();
  expect(first).not.toBe(second);
});

test('slugExists returns false for a slug that is not in the database', async () => {
  const exists = await slugExists(pool, 'zzznotreal');
  expect(exists).toBe(false);
});

test('generateUniqueSlug returns a slug that does not already exist', async () => {
  const slug = await generateUniqueSlug(pool);
  const exists = await slugExists(pool, slug);
  expect(exists).toBe(false);
});