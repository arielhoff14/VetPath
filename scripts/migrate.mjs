import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL first.');
const client = new pg.Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try {
 await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
 const files = (await readdir('src/db/migrations')).filter(f=>f.endsWith('.sql')).sort();
 for(const name of files){
  await client.query('BEGIN');
  try { await client.query('SELECT pg_advisory_xact_lock(90481522)');
   const existing = await client.query('SELECT 1 FROM schema_migrations WHERE name=$1',[name]);
   if(!existing.rowCount){await client.query(await readFile(`src/db/migrations/${name}`,'utf8'));await client.query('INSERT INTO schema_migrations(name) VALUES($1)',[name]);console.log(`Applied ${name}`);}
   await client.query('COMMIT');
  }catch(error){await client.query('ROLLBACK');throw error;}
 }
}finally{await client.end();}
