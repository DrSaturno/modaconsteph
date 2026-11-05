import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

export type Row = Record<string, any>;
export type Query = <T extends Row = Row>(text: string, params?: unknown[]) => Promise<T[]>;
export type Db = { query: Query; tx: <T>(fn: (q: Query) => Promise<T>) => Promise<T>; local: boolean };

const g = globalThis as unknown as { __mcsDb?: Promise<Db> };

/**
 * Con DATABASE_URL usa PostgreSQL (Supabase, Neon o el que se elija).
 * Sin DATABASE_URL, en una máquina de desarrollo, usa una base embebida (PGlite) en `.data/`,
 * así la web funciona completa sin crear cuentas. En Vercel sin DATABASE_URL falla a propósito.
 */
export function db(): Promise<Db> {
  return (g.__mcsDb ??= open());
}

export async function query<T extends Row = Row>(text: string, params?: unknown[]): Promise<T[]> {
  return (await db()).query<T>(text, params);
}

export async function tx<T>(fn: (q: Query) => Promise<T>): Promise<T> {
  return (await db()).tx(fn);
}

export function schemaSql(): string {
  return fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');
}

async function open(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: postgres } = await import('postgres');
    // `npm run dev` conecta a una base de prueba que atiende de a un cliente: cada proceso la usa un instante y la suelta
    const prueba = process.env.MCS_DB_PRUEBA === '1';
    const sql = postgres(url, prueba
      ? { max: 1, prepare: false, idle_timeout: 0.3, connect_timeout: 60 }
      // max_pipeline: 1 → una consulta por vez en cada conexión. El pooler de Supabase en modo transacción (Supavisor)
      // no soporta que el driver encole varias consultas en la misma conexión: quedan colgadas hasta el timeout.
      : { max: 5, prepare: false, max_pipeline: 1, idle_timeout: 20, connect_timeout: 15 });
    const run = (s: { unsafe: (t: string, p?: any[]) => PromiseLike<any> }): Query =>
      (async (text: string, params?: unknown[]) => Array.from(await s.unsafe(text, params as any[]))) as Query;
    // en la base de prueba, si justo se suelta la conexión se vuelve a intentar enseguida
    const reintentar = async <T>(fn: () => PromiseLike<T>): Promise<T> => {
      for (let i = 0; ; i++) {
        try { return await fn(); } catch (e) {
          const code = (e as { code?: string })?.code;
          if (!prueba || i >= 4 || !['ECONNRESET', 'CONNECTION_CLOSED', 'CONNECTION_ENDED', 'ECONNREFUSED'].includes(code ?? '')) throw e;
          await new Promise((r) => setTimeout(r, 150 * (i + 1)));
        }
      }
    };
    const consulta = run(sql);
    return {
      local: false,
      query: (prueba ? ((t: string, p?: unknown[]) => reintentar(() => consulta(t, p))) : consulta) as Query,
      tx: (fn) => reintentar(() => sql.begin((t) => fn(run(t)))) as Promise<any>,
    };
  }

  if (process.env.VERCEL) throw new Error('Falta DATABASE_URL: la web no puede arrancar sin base de datos.');

  const { PGlite } = await import('@electric-sql/pglite');
  // Durante `next build` se corre en varios procesos: cada uno usa su propia base en memoria.
  const enMemoria = process.env.NEXT_PHASE === 'phase-production-build';
  let dir: string | undefined;
  if (!enMemoria) {
    dir = path.join(process.cwd(), '.data', 'pglite');
    fs.mkdirSync(path.dirname(dir), { recursive: true });
  }
  const pg = new PGlite(dir);
  await pg.waitReady;
  const run = (c: { query: (t: string, p?: any[]) => Promise<{ rows: any[] }> }): Query =>
    (async (text: string, params?: unknown[]) => (await c.query(text, params as any[])).rows) as Query;
  const handle: Db = {
    local: true,
    query: run(pg),
    tx: (fn) => pg.transaction((t) => fn(run(t))),
  };

  const existe = await handle.query<{ r: string | null }>(`select to_regclass('public.cursos') as r`);
  if (!existe[0]?.r) {
    await pg.exec(schemaSql());
    const { cargarBase, cargarCatalogo, cargarDemo } = await import('./base-data');
    await cargarBase(handle.query);
    await cargarCatalogo(handle.query);
    await cargarDemo(handle.query);
  }
  return handle;
}
