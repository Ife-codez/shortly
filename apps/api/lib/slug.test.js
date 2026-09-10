const slugModule = require('./slug');
const { Pool } = require('pg');
const { generateSlug, slugExists, generateUniqueSlug } = require('./slug');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

afterAll(async () => {
  await pool.end();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await pool.query('DELETE FROM links WHERE slug IN ($1, $2)', ['FAKE001', 'FAKE002']);
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

test('generateUniqueSlug retries after a forced slug collision', async () => {
  const takenSlug = 'FAKE001';
  const freeSlug = 'FAKE002';

  // Plant a real row in the database using the "taken" slug
  await pool.query(
    `INSERT INTO links (slug, original_url, custom) VALUES ($1, $2, $3)`,
    [takenSlug, 'https://example.com/fake', false]
  );

  // Force generateSlug to return takenSlug first, then freeSlug second
  jest.spyOn(slugModule, 'generateSlug')
    .mockReturnValueOnce(takenSlug)
    .mockReturnValueOnce(freeSlug);

  const result = await slugModule.generateUniqueSlug(pool);

  // It must have skipped the taken one and landed on the free one
  expect(result).toBe(freeSlug);

});