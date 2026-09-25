const request = require('supertest');
const { app, pool, redisClient } = require('./app');

afterAll(async () => {
  await pool.end();
  await redisClient.quit();
});

afterEach(async () => {
  await pool.query("DELETE FROM click_events WHERE link_id IN (SELECT id FROM links WHERE slug LIKE 'test%' OR slug LIKE 'cache%')");
  await pool.query("DELETE FROM links WHERE slug LIKE 'test%' OR slug LIKE 'cache%'");
  await redisClient.del(['slug:testslug1', 'slug:testslug2', 'slug:cachetest1']);
  jest.restoreAllMocks();
});

async function waitForClickEvent(linkId, maxAttempts = 10, delayMs = 100) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await pool.query('SELECT * FROM click_events WHERE link_id = $1', [linkId]);
    if (result.rows.length > 0) {
      return result.rows;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return [];
}

test('redirects to the original url for a known slug', async () => {
  await pool.query(
    `INSERT INTO links (slug, original_url, custom, user_id) VALUES ($1, $2, $3, $4)`,
    ['testslug1', 'https://example.com/redirect-test', false, '00000000-0000-0000-0000-000000000000']
  );

  const response = await request(app).get('/testslug1');

  expect(response.status).toBe(302);
  expect(response.headers.location).toBe('https://example.com/redirect-test');

});

test('returns 404 for an unknown slug', async () => {
  const response = await request(app).get('/this-slug-does-not-exist');

  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Link not found');
});

test('records a click event when a link is visited', async () => {
  const linkResult = await pool.query(
    `INSERT INTO links (slug, original_url, custom, user_id) VALUES ($1, $2, $3, $4) RETURNING id`,
    ['testslug2', 'https://example.com/click-test', false, '00000000-0000-0000-0000-000000000000']
  );
  const linkId = linkResult.rows[0].id;

  await request(app)
    .get('/testslug2')
    .set('Referer', 'https://google.com')
    .set('User-Agent', 'Test Agent');

  // Give the background insert a brief moment to complete
  const clickRows = await waitForClickEvent(linkId);

  expect(clickRows.length).toBe(1);
  expect(clickRows[0].referrer).toBe('https://google.com');
  expect(clickRows[0].user_agent).toBe('Test Agent');

});

test('a cached slug does not query postgres on the second request', async () => {
  const linkResult = await pool.query(
    `INSERT INTO links (slug, original_url, custom, user_id) VALUES ($1, $2, $3, $4) RETURNING id`,
    ['cachetest1', 'https://example.com/cache-test', false, '00000000-0000-0000-0000-000000000000']
  );
  const linkId = linkResult.rows[0].id;

  // First request — populates the cache, link stays in Postgres
  await request(app).get('/cachetest1');
  await waitForClickEvent(linkId);

  // spy on pool.query to inspect what it's called with
  const querySpy = jest.spyOn(pool, 'query');

  const response = await request(app).get('/cachetest1');

  expect(response.status).toBe(302);
  expect(response.headers.location).toBe('https://example.com/cache-test');

  // Confirm the slug lookup SELECT was never issued on this second request
  const slugLookupCalls = querySpy.mock.calls.filter(([sql]) =>
    sql.includes('SELECT id, original_url FROM links')
  );
  expect(slugLookupCalls.length).toBe(0);

  querySpy.mockRestore();
});

// Test for DELETE /links/:slug removed along with the route itself —
// see app.js for why (no ownership check exists until auth is added).