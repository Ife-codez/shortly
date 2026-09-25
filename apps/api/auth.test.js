const request = require('supertest');
const { app, pool, redisClient } = require('./app');

afterAll(async () => {
  await pool.end();
  await redisClient.quit();
});

afterEach(async () => {
  await pool.query("DELETE FROM links WHERE original_url LIKE '%auth-test%'");
  await pool.query("DELETE FROM users WHERE email LIKE '%authtest%'");
});

test('signup creates a user and does not return the password hash', async () => {
  const response = await request(app)
    .post('/auth/signup')
    .send({ email: 'authtest1@example.com', password: 'password123' });

  expect(response.status).toBe(201);
  expect(response.body.email).toBe('authtest1@example.com');
  expect(response.body.password_hash).toBeUndefined();
});

test('signup rejects a duplicate email', async () => {
  await request(app)
    .post('/auth/signup')
    .send({ email: 'authtest2@example.com', password: 'password123' });

  const response = await request(app)
    .post('/auth/signup')
    .send({ email: 'authtest2@example.com', password: 'different' });

  expect(response.status).toBe(409);
});

test('signin returns a token for correct credentials', async () => {
  await request(app)
    .post('/auth/signup')
    .send({ email: 'authtest3@example.com', password: 'password123' });

  const response = await request(app)
    .post('/auth/signin')
    .send({ email: 'authtest3@example.com', password: 'password123' });

  expect(response.status).toBe(200);
  expect(response.body.token).toBeDefined();
});

test('signin rejects an incorrect password', async () => {
  await request(app)
    .post('/auth/signup')
    .send({ email: 'authtest4@example.com', password: 'password123' });

  const response = await request(app)
    .post('/auth/signin')
    .send({ email: 'authtest4@example.com', password: 'wrongpassword' });

  expect(response.status).toBe(401);
});

test('creating a link without a token is rejected', async () => {
  const response = await request(app)
    .post('/links')
    .send({ url: 'https://example.com/auth-test-no-token' });

  expect(response.status).toBe(401);
});

test('a user cannot fetch a link belonging to another user', async () => {
  await request(app)
    .post('/auth/signup')
    .send({ email: 'authtest5@example.com', password: 'password123' });
  const ownerSignin = await request(app)
    .post('/auth/signin')
    .send({ email: 'authtest5@example.com', password: 'password123' });
  const ownerToken = ownerSignin.body.token;

  const createResponse = await request(app)
    .post('/links')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ url: 'https://example.com/auth-test-owned' });
  const linkId = createResponse.body.id;

  await request(app)
    .post('/auth/signup')
    .send({ email: 'authtest6@example.com', password: 'password123' });
  const otherSignin = await request(app)
    .post('/auth/signin')
    .send({ email: 'authtest6@example.com', password: 'password123' });
  const otherToken = otherSignin.body.token;

  const response = await request(app)
    .get(`/links/${linkId}`)
    .set('Authorization', `Bearer ${otherToken}`);

  expect(response.status).toBe(404);
});