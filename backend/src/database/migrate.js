import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export const parseDatabaseConfig = (connectionString) => {
  const url = new URL(connectionString);
  return {
    user: url.username,
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: parseInt(url.port || '5432', 10),
    database: url.pathname.replace(/^\//, '')
  };
};

export const ensureDatabaseExists = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const dbConfig = parseDatabaseConfig(connectionString);
  const targetDb = dbConfig.database;

  const adminClient = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: 'postgres'
  });

  try {
    await adminClient.connect();
    const checkRes = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDb]
    );

    if (checkRes.rowCount === 0) {
      console.log(`Database "${targetDb}" does not exist. Creating...`);
      // Escape identifier safely
      await adminClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`Database "${targetDb}" created successfully.`);
    }
  } finally {
    await adminClient.end();
  }
};

export const ensureMigrationTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

export const getAppliedMigrations = async (client) => {
  const res = await client.query('SELECT name FROM schema_migrations ORDER BY id ASC');
  return res.rows.map((row) => row.name);
};

export const getMigrationFiles = async () => {
  const entries = await fs.readdir(MIGRATIONS_DIR);
  return entries
    .filter((file) => file.endsWith('.sql'))
    .sort();
};

export const applyMigration = async (client, filename) => {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = await fs.readFile(filePath, 'utf-8');

  console.log(`Applying migration: ${filename}...`);
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (name) VALUES ($1)',
      [filename]
    );
    await client.query('COMMIT');
    console.log(`Migration ${filename} applied successfully.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Migration ${filename} failed:`, error.message);
    throw error;
  }
};

export const runMigrations = async () => {
  console.log('--- Starting Database Migrations ---');
  await ensureDatabaseExists();

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    await ensureMigrationTable(client);

    const appliedMigrations = await getAppliedMigrations(client);
    const allMigrationFiles = await getMigrationFiles();
    const pendingMigrations = allMigrationFiles.filter(
      (file) => !appliedMigrations.includes(file)
    );

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations. Schema is up to date.');
      return;
    }

    for (const migrationFile of pendingMigrations) {
      await applyMigration(client, migrationFile);
    }

    console.log('All migrations completed successfully.');
  } finally {
    await client.end();
  }
};

// Execute if run directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration error:', err);
      process.exit(1);
    });
}
