import { Client } from 'pg';

describe('Reservation schema', () => {
  let client: Client;

  beforeAll(async () => {
    client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it('has the agreed statuses, in order', async () => {
    const res = await client.query<{ label: string }>(
      `SELECT enumlabel AS label
         FROM pg_enum
         JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
        WHERE pg_type.typname = 'reservations_status_enum'
        ORDER BY enumsortorder`,
    );
    expect(res.rows.map((r) => r.label)).toEqual([
      'pending',
      'paid',
      'expired',
      'cancelled',
    ]);
  });

  it('stores the payment timestamp in paid_at', async () => {
    const res = await client.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'reservations' AND column_name IN ('paid_at', 'confirmed_at')`,
    );
    expect(res.rows.map((r) => r.column_name)).toEqual(['paid_at']);
  });
});
