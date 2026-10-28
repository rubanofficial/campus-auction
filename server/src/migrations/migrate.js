import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure server/.env is loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { getPool, closeDatabase } from '../config/database.js';

export const runMigrations = async () => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('[Migration] Starting database migration...');

    // 1. Create migration tracking table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Read migration SQL files
    const migrationsDir = __dirname;
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT filename FROM schema_migrations WHERE filename = $1',
        [file]
      );

      if (rows.length === 0) {
        console.log(`[Migration] Applying ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query(
            'INSERT INTO schema_migrations (filename) VALUES ($1)',
            [file]
          );
          await client.query('COMMIT');
          console.log(`[Migration] Successfully applied ${file}`);
        } catch (migrationError) {
          await client.query('ROLLBACK');
          console.error(`[Migration] Failed to apply ${file}: ${migrationError.message}`);
          throw migrationError;
        }
      } else {
        console.log(`[Migration] Already applied: ${file}`);
      }
    }

    console.log('[Migration] All migrations completed successfully.');
  } finally {
    client.release();
  }
};

// If run directly via CLI
if (process.argv[1] === __filename) {
  runMigrations()
    .then(async () => {
      await closeDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Migration Error]', err.message);
      await closeDatabase();
      process.exit(1);
    });
}
