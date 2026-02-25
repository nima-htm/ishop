import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, timestamp, userId } = req.body;

    if (!data || !userId) {
      return res.status(400).json({ error: 'Missing data or userId' });
    }

    // Connect to Neon database
    const sql = neon(process.env.DATABASE_URL);

    // Create table if not exists (for simplicity, assuming we create it once)
    // In production, you might want to run migrations separately
    await sql`
      CREATE TABLE IF NOT EXISTS backups (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        data JSONB NOT NULL
      )
    `;

    // Insert the backup data
    await sql`
      INSERT INTO backups (user_id, timestamp, data)
      VALUES (${userId}, ${timestamp}, ${JSON.stringify(data)}::jsonb)
    `;

    res.status(200).json({ message: 'Backup saved successfully' });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}