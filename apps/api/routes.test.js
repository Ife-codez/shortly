const request = require('supertest');
const { app, pool, redisClient } = require('./app');

afterAll(async () => {
  await pool.end();
  await redisClient.quit();
});

test('redirects to the original url for a known slug', async () => {
  await pool.query(
    `INSERT INTO links (slug, original_url, custom) VALUES ($1, $2, $3)`,
    ['testslug1', 'https://example.com/redirect-test', false]
  );

  const response = await request(app).get('/testslug1');

  expect(response.status).toBe(302);
  expect(response.headers.location).toBe('https://example.com/redirect-test');

  await pool.query('DELETE FROM links WHERE slug = $1', ['testslug1']);
});

test('returns 404 for an unknown slug', async () => {
  const response = await request(app).get('/this-slug-does-not-exist');

  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Link not found');
});

test('records a click event when a link is visited', async () => {
  const linkResult = await pool.query(
    `INSERT INTO links (slug, original_url, custom) VALUES ($1, $2, $3) RETURNING id`,
    ['testslug2', 'https://example.com/click-test', false]
  );
  const linkId = linkResult.rows[0].id;

  await request(app)
    .get('/testslug2')
    .set('Referer', 'https://google.com')
    .set('User-Agent', 'Test Agent');

  // Give the background insert a brief moment to complete,
  // since the redirect responds before the click is recorded
  await new Promise((resolve) => setTimeout(resolve, 200));

  const clickResult = await pool.query(
    'SELECT * FROM click_events WHERE link_id = $1',
    [linkId]
  );

  expect(clickResult.rows.length).toBe(1);
  expect(clickResult.rows[0].referrer).toBe('https://google.com');
  expect(clickResult.rows[0].user_agent).toBe('Test Agent');

  await pool.query('DELETE FROM click_events WHERE link_id = $1', [linkId]);
  await pool.query('DELETE FROM links WHERE id = $1', [linkId]);
});

test('a cached slug redirects correctly even if postgres is unavailable', async () => {
  const linkResult = await pool.query(
    `INSERT INTO links (slug, original_url, custom) VALUES ($1, $2, $3) RETURNING id`,
    ['cachetest1', 'https://example.com/cache-test', false]
  );
  const linkId = linkResult.rows[0].id;

  // First request — populates the cache
  await request(app).get('/cachetest1');

  // Manually clear the row from Postgres, but leave the Redis cache intact
  await pool.query('DELETE FROM links WHERE id = $1', [linkId]);

  // Second request — should still succeed, purely from cache
  const response = await request(app).get('/cachetest1');

  expect(response.status).toBe(302);
  expect(response.headers.location).toBe('https://example.com/cache-test');

  await redisClient.del('slug:cachetest1');
});

test('deleting a link removes it from the cache', async () => {
  await pool.query(
    `INSERT INTO links (slug, original_url, custom) VALUES ($1, $2, $3)`,
    ['cachetest2', 'https://example.com/delete-cache-test', false]
  );

  // Visit once, to populate the cache
  await request(app).get('/cachetest2');

  const cachedBefore = await redisClient.get('slug:cachetest2');
  expect(cachedBefore).not.toBeNull();

  // Delete the link through the real endpoint
  await request(app).delete('/links/cachetest2');

  const cachedAfter = await redisClient.get('slug:cachetest2');
  expect(cachedAfter).toBeNull();

  // Confirm the slug now correctly 404s
  const response = await request(app).get('/cachetest2');
  expect(response.status).toBe(404);
});