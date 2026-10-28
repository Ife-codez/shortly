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

test('a new user sees an empty links list', async () => {
  await request(app)
    .post('/auth/signup')
    .send({ email: 'authtest7@example.com', password: 'password123' });
  const signin = await request(app)
    .post('/auth/signin')
    .send({ email: 'authtest7@example.com', password: 'password123' });

  const response = await request(app)
    .get('/links')
    .set('Authorization', `Bearer ${signin.body.token}`);

  expect(response.status).toBe(200);
  expect(response.body).toEqual([]);
});

test('owner can fetch their own link and gets 200', async () => {
  await request(app)
    .post('/auth/signup')
    .send({ email: 'authtest10@example.com', password: 'password123' });
  const signin = await request(app)
    .post('/auth/signin')
    .send({ email: 'authtest10@example.com', password: 'password123' });
  const token = signin.body.token;

  const createResponse = await request(app)
    .post('/links')
    .set('Authorization', `Bearer ${token}`)
    .send({ url: 'https://example.com/auth-test-owned-fetch' });
  const linkId = createResponse.body.id;

  const response = await request(app)
    .get(`/links/${linkId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(response.body.id).toBe(linkId);
});

test('a user only sees their own links, not others', async () => {
  await request(app)
    .post('/auth/signup')
    .send({ email: 'authtest8@example.com', password: 'password123' });
  const signinA = await request(app)
    .post('/auth/signin')
    .send({ email: 'authtest8@example.com', password: 'password123' });

  await request(app)
    .post('/links')
    .set('Authorization', `Bearer ${signinA.body.token}`)
    .send({ url: 'https://example.com/auth-test-list-a' });

  await request(app)
    .post('/auth/signup')
    .send({ email: 'authtest9@example.com', password: 'password123' });
  const signinB = await request(app)
    .post('/auth/signin')
    .send({ email: 'authtest9@example.com', password: 'password123' });

  const response = await request(app)
    .get('/links')
    .set('Authorization', `Bearer ${signinB.body.token}`);

  expect(response.status).toBe(200);
  expect(response.body).toEqual([]);
});

test('fetching a link with a malformed id returns 400, not 500', async () => {
  await request(app)
    .post('/auth/signup')
    .send({ email: 'authtest11@example.com', password: 'password123' });
  const signin = await request(app)
    .post('/auth/signin')
    .send({ email: 'authtest11@example.com', password: 'password123' });

  const response = await request(app)
    .get('/links/not-a-uuid')
    .set('Authorization', `Bearer ${signin.body.token}`);

  expect(response.status).toBe(400);
});

describe('signup validation', () => {
  test.each([
    ['an email with no domain', { email: 'abc', password: 'password123' }],
    ['an email missing the part after @', { email: 'abc@', password: 'password123' }],
    ['an email containing a space', { email: 'a b@example.com', password: 'password123' }],
    ['a numeric email', { email: 12345, password: 'password123' }],
    ['an object as the email', { email: { a: 1 }, password: 'password123' }],
    ['a numeric password', { email: 'authtest20@example.com', password: 12345678 }],
    ['an array as the password', { email: 'authtest21@example.com', password: ['password123'] }],
    ['a password shorter than 8 characters', { email: 'authtest22@example.com', password: 'short' }],
    ['a password longer than 72 bytes', { email: 'authtest23@example.com', password: 'a'.repeat(73) }],
  ])('rejects %s with a 400', async (_label, body) => {
    const response = await request(app).post('/auth/signup').send(body);

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  test('rejects a request with no body with a 400', async () => {
    const response = await request(app).post('/auth/signup');

    expect(response.status).toBe(400);
  });
});

test('signin rejects a non-text email with a 400', async () => {
  const response = await request(app)
    .post('/auth/signin')
    .send({ email: 12345, password: 'password123' });

  expect(response.status).toBe(400);
});