import 'server-only';
import { query } from './db';
import { partes } from './format';

/** Mismo día de la semana y mismo orden dentro del mes (ej.: 2.º sábado), en el mes siguiente. Horario de Buenos Aires. */
export function mismoDiaMesSiguiente(base: Date): Date {
  const ar = new Date(base.getTime() - 3 * 3600_000);
  const dia = ar.getUTCDate();
  const semana = ar.getUTCDay();
  const orden = Math.ceil(dia / 7);
  const primero = new Date(Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth() + 1, 1, ar.getUTCHours(), ar.getUTCMinutes()));
  const desfase = (semana - primero.getUTCDay() + 7) % 7;
  let objetivo = 1 + desfase + (orden - 1) * 7;
  const diasMes = new Date(Date.UTC(primero.getUTCFullYear(), primero.getUTCMonth() + 1, 0)).getUTCDate();
  if (objetivo > diasMes) objetivo -= 7; // no hay 5.º: se usa el último
  return new Date(Date.UTC(primero.getUTCFullYear(), primero.getUTCMonth(), objetivo, ar.getUTCHours(), ar.getUTCMinutes()) + 3 * 3600_000);
}

/**
 * Cuando una fecha "que se repite" ya pasó, abre la siguiente.
 * Si el curso tiene otras clases escritas a mano, la nueva queda en borrador para que Steph cargue esas fechas.
 */
export async function abrirRepeticiones(): Promise<number> {
  const viejas = await query(
    `select f.* from fechas f
      where f.repite <> 'no' and f.estado <> 'borrador' and f.inicio < now()
        and not exists (select 1 from fechas x where x.curso_id = f.curso_id and x.inicio > f.inicio)`);
  let n = 0;
  for (const f of viejas) {
    const ini = new Date(f.inicio);
    const nueva = f.repite === 'quincenal' ? new Date(ini.getTime() + 14 * 86400_000) : mismoDiaMesSiguiente(ini);
    if (nueva <= new Date()) continue;
    const delta = nueva.getTime() - ini.getTime();
    const fin = f.fin ? new Date(new Date(f.fin).getTime() + delta) : null;
    const edicion = /^edici[oó]n /i.test(f.edicion) ? `Edición ${partes(nueva.toISOString()).mesLargo}` : f.edicion;
    await query(
      `insert into fechas (curso_id, edicion, inicio, fin, hora, otras_clases, cupo, precio, precio_lista, link_online, direccion, repite, estado)
       values ($1,$2,$3,$4,$5,'',$6,$7,$8,$9,$10,$11,$12)`,
      [f.curso_id, edicion, nueva.toISOString(), fin?.toISOString() ?? null, f.hora, f.cupo, f.precio, f.precio_lista,
       f.link_online, f.direccion, f.repite, f.otras_clases ? 'borrador' : 'abierta'],
    );
    await query(`update fechas set repite = 'no', updated_at = now() where id = $1`, [f.id]);
    n++;
  }
  return n;
}
