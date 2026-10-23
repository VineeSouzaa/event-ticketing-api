import { Client } from 'pg';

describe('Schema Integration', () => {
  let client: Client;

  beforeAll(async () => {
    client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it('should be able to connect to the database', async () => {
    const res = await client.query<{ ok: number }>('SELECT 1 AS ok');
    expect(res.rows[0].ok).toBe(1);
  });

  it('should reject a ticket tier going below zero (CHECK available >= 0)', async () => {
    const event = await client.query<{ id: string }>(
      `INSERT INTO events (name, description, starts_at, venue, status, city, category, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        'test_name',
        'test_description',
        '2026-10-23T15:33:22.626Z',
        'test_venue',
        'published',
        'test_city',
        'test_category',
        'test_img_url',
      ],
    );

    const tier = await client.query<{ id: string }>(
      `INSERT INTO ticket_tiers (event_id, name, price, total_quantity, available)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [event.rows[0].id, 'test_name', 1000, 100, 100],
    );

    await expect(
      client.query('UPDATE ticket_tiers SET available = -1 WHERE id = $1', [
        tier.rows[0].id,
      ]),
    ).rejects.toThrow(/violates check constraint/);
  });
});
