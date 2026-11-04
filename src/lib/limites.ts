import 'server-only';
import { query } from './db';

/** Devuelve false si `clave` ya se usó `max` veces en los últimos `segundos`. Si pasa, registra el uso. */
export async function permitir(clave: string, max: number, segundos: number): Promise<boolean> {
  const r = await query<{ n: number }>(
    `select count(*)::int as n from limites where clave = $1 and en > now() - make_interval(secs => $2)`,
    [clave, segundos],
  );
  if (r[0].n >= max) return false;
  await query(`insert into limites (clave) values ($1)`, [clave]);
  // limpieza ocasional
  if (Math.random() < 0.02) await query(`delete from limites where en < now() - interval '2 days'`);
  return true;
}
