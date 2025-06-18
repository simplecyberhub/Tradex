import * as schema from "@shared/schema";
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to configure your database?");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true, // Disable SSL for local PostgreSQL
});

export const db = drizzle({ client: pool, schema });
