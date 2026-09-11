const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to run seed script against production. Aborting.');
    process.exit(1);
  }
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clear existing data first, so this script is safe to re-run
    await client.query(
      'TRUNCATE click_events, links, users RESTART IDENTITY CASCADE'
    );

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id`,
      ['test@example.com', 'fake_hashed_password']
    );
    const userId = userResult.rows[0].id;

    const linkResult = await client.query(
      `INSERT INTO links (slug, original_url, user_id, custom)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['abc123', 'https://example.com/some/long/path', userId, false]
    );
    const linkId = linkResult.rows[0].id;

    await client.query(
      `INSERT INTO click_events (link_id, referrer, user_agent, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [
        linkId,
        'https://google.com',
        'Mozilla/5.0 (Windows NT 10.0)',
        '192.168.1.1',
      ]
    );

    await client.query('COMMIT');
    console.log('Seed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
