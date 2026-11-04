/* Prepara una base nueva: crea las tablas y carga los mails, ajustes y el catálogo actual de Steph.
 *   npm run db:migrar            (usa DATABASE_URL de .env.local o del entorno)
 * Se puede repetir sin riesgo: no pisa lo que ya existe. */
import { readFileSync, existsSync } from 'node:fs';
import postgres from 'postgres';
import { cargarBase, cargarCatalogo } from '../src/lib/base-data';

if (existsSync('.env.local')) {
  for (const l of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z_]+)=(.*)$/.exec(l);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL (la dirección de conexión de la base PostgreSQL).');
  process.exit(1);
}
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const q = (async (text: string, params?: unknown[]) => Array.from(await sql.unsafe(text, params as any[]))) as any;
await sql.unsafe(readFileSync('db/schema.sql', 'utf8'));
await cargarBase(q);
await cargarCatalogo(q);
console.log('Base lista: tablas creadas, mails y ajustes cargados, catálogo actual cargado.');
await sql.end();
