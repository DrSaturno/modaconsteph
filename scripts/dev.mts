/* Arranque local, sin crear ninguna cuenta:
 *   npm run dev                 → http://localhost:3000
 *   npm run dev -- -p 3210      → en otro puerto
 *
 * La base de prueba (PGlite) corre en su propio proceso y la web se conecta como lo haría a una base de verdad.
 * Hace falta porque `next dev` usa varios procesos a la vez y una base embebida abierta en cada uno se corrompe
 * en cuanto alguien guarda algo. Los datos quedan en `.data/`; para empezar de cero, borrá esa carpeta. */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { cargarBase, cargarCatalogo, cargarDemo } from '../src/lib/base-data';
import type { Query } from '../src/lib/db';

const PUERTO_BASE = Number(process.env.MCS_DB_PORT ?? 54329);
const dir = path.join(process.cwd(), '.data', 'pglite');
fs.mkdirSync(path.dirname(dir), { recursive: true });

const db = new PGlite(dir);
await db.waitReady;
const q = (async (text: string, params?: unknown[]) => (await db.query(text, params)).rows) as Query;
const hay = await db.query<{ r: string | null }>(`select to_regclass('public.cursos') as r`);
if (!hay.rows[0]?.r) {
  await db.exec(fs.readFileSync('db/schema.sql', 'utf8'));
  await cargarBase(q);
  await cargarCatalogo(q);
  await cargarDemo(q);
  console.log('[base de prueba] creada con el catálogo actual y alumnas de ejemplo');
}

// de a un cliente por vez: con varios a la vez, el servidor de prueba mezcla las consultas de unos con las de otros
const servidor = new PGLiteSocketServer({ db, port: PUERTO_BASE, host: '127.0.0.1', maxConnections: 1 });
await servidor.start();
console.log(`[base de prueba] lista en el puerto ${PUERTO_BASE}`);

const hijo = spawn('npx', ['next', 'dev', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: `postgres://postgres:postgres@127.0.0.1:${PUERTO_BASE}/postgres`, MCS_DB_PRUEBA: '1' },
});

let cerrando = false;
async function cerrar(codigo: number) {
  if (cerrando) return;
  cerrando = true;
  if (hijo.pid && hijo.exitCode === null) {
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(hijo.pid), '/T', '/F'], { stdio: 'ignore' });
    else hijo.kill('SIGTERM');
  }
  await servidor.stop().catch(() => {});
  await db.close().catch(() => {});
  process.exit(codigo);
}
hijo.on('exit', (c) => cerrar(c ?? 0));
process.on('SIGINT', () => cerrar(0));
process.on('SIGTERM', () => cerrar(0));
