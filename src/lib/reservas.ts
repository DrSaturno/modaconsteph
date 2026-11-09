import 'server-only';
import crypto from 'node:crypto';
import { z } from 'zod';
import { query, tx } from './db';
import { leerAjustes } from './ajustes';
import { calcularSena, esEmail, fechaLarga, precioEfectivo } from './format';
import { permitir } from './limites';
import { encolar, enviarAhora, programarConfirmada } from './mail/cola';
import { crearPreferencia, mpConfigurado, simulacroActivo } from './mp';
import { registrarCompra } from './tracking/servidor';
import type { ResultadoReserva } from './tipos';

const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const generarCodigo = () => 'MCS-' + Array.from({ length: 6 }, () => ALFABETO[crypto.randomInt(ALFABETO.length)]).join('');

const Persona = z.object({
  nombre: z.string().trim().min(3, 'Completá tu nombre y apellido.').max(80),
  email: z.string().trim().max(120).refine(esEmail, 'Revisá el email: tiene que ser como nombre@correo.com.'),
  tel: z.string().trim().max(40).refine((t) => t.replace(/\D/g, '').length >= 8, 'Completá tu WhatsApp con código de área, por ejemplo 11 2345 6789.'),
  novedades: z.boolean().default(false),
});
/** De dónde vino la visita y los identificadores del navegador. Es un extra: si viene mal formado se ignora, nunca frena una reserva. */
const Campania = z.object({
  utm_source: z.string().max(200), utm_medium: z.string().max(200), utm_campaign: z.string().max(200),
  utm_content: z.string().max(200), utm_term: z.string().max(200), fbclid: z.string().max(300), gclid: z.string().max(300),
  referrer: z.string().max(200), landing: z.string().max(200), ts: z.number(),
}).partial();
const Rastreo = z.object({
  fbp: z.string().max(120), fbc: z.string().max(200), gaClientId: z.string().max(60), gaSessionId: z.string().max(20), url: z.string().max(400),
  primero: Campania, ultimo: Campania,
}).partial();
const Reserva = Persona.extend({
  rastreo: Rastreo.optional().catch(undefined),
  cursoId: z.uuid(),
  fechaId: z.uuid().nullable(),
  primeraVez: z.boolean().default(true),
  modo: z.enum(['total', 'sena']),
  metodo: z.enum(['mp', 'transferencia', 'exterior']),
  espera: z.boolean().default(false),
  motivo: z.string().trim().max(1500).default(''),
  regalo: z.object({
    para: z.string().trim().min(2, 'Escribí para quién es el regalo.').max(80),
    paraEmail: z.string().trim().max(120).refine((e) => e === '' || esEmail(e), 'Revisá el email de quien recibe el regalo.'),
    mensaje: z.string().trim().max(600),
    envio: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Revisá la fecha de envío.'),
  }).nullable().default(null),
});
export type EntradaReserva = z.input<typeof Reserva>;

const primerError = (e: z.ZodError) => e.issues[0]?.message ?? 'Revisá los datos.';

async function suscribirSiquiere(email: string, quiere: boolean, origen: string) {
  if (!quiere) return;
  await query(
    `insert into suscriptores (email, origen) values ($1, $2) on conflict (lower(email)) do update set baja_en = null`,
    [email.toLowerCase(), origen],
  );
}

/** La alumna reserva. El cupo se controla acá, con la fecha bloqueada, así dos personas no se llevan el mismo último lugar. */
export async function crearReserva(entrada: unknown, ip: string, ua = ''): Promise<ResultadoReserva> {
  const p = Reserva.safeParse(entrada);
  if (!p.success) return { ok: false, error: primerError(p.error) };
  const d = p.data;
  if (!(await permitir(`reserva:ip:${ip}`, 12, 3600)) || !(await permitir(`reserva:mail:${d.email.toLowerCase()}`, 5, 86400)))
    return { ok: false, error: 'Hiciste muchos intentos seguidos. Probá de nuevo en un rato o escribinos por WhatsApp.' };

  const a = await leerAjustes();
  const curso = (await query(`select * from cursos where id = $1 and activo`, [d.cursoId]))[0];
  if (!curso) return { ok: false, error: 'Este curso ya no está disponible.' };
  if (curso.kind === 'consulta') return crearConsulta(d, curso);
  if (d.metodo === 'mp' && !mpConfigurado() && !simulacroActivo()) return { ok: false, error: 'El pago con Mercado Pago no está disponible por ahora. Elegí transferencia o escribinos por WhatsApp.' };
  if (d.metodo === 'mp' && curso.medios === 'transferencia') return { ok: false, error: 'Este curso se paga solo por transferencia.' };
  if (d.metodo === 'transferencia' && curso.medios === 'mp') return { ok: false, error: 'Este curso se paga solo con Mercado Pago.' };
  if (d.metodo === 'exterior' && !['online', 'regalo'].includes(curso.tipo)) return { ok: false, error: 'El pago desde el exterior es solo para cursos online y gift cards.' };
  if (curso.kind === 'regalo' && !d.regalo) return { ok: false, error: 'Escribí para quién es el regalo.' };

  const codigo = generarCodigo();
  type Creada = { id: string; estado: string; monto: number; titulo: string; ultimo: boolean } | { error: string };
  const r = await tx<Creada>(async (q) => {
    let fecha: Record<string, any> | null = null;
    if (curso.kind === 'fecha' || curso.kind === 'slot') {
      if (!d.fechaId) return { error: 'Elegí una fecha para continuar.' };
      fecha = (await q(`select * from fechas where id = $1 and curso_id = $2 for update`, [d.fechaId, curso.id]))[0] ?? null;
      const publicada = fecha && (fecha.estado === 'abierta' || (fecha.estado === 'borrador' && fecha.publicar_en && new Date(fecha.publicar_en) <= new Date()));
      if (!fecha || !publicada || new Date(fecha.inicio) <= new Date()) return { error: 'Esa fecha ya no está disponible. Elegí otra.' };
      const repetida = await q(
        `select 1 from reservas where fecha_id = $1 and lower(email) = lower($2)
           and (estado = 'confirmada' or (estado = 'pendiente' and vence_en > now()) or estado = 'espera') limit 1`, [fecha.id, d.email]);
      if (repetida.length) return { error: 'Ya tenés un lugar (o un pedido en curso) con este mail para esa fecha. Revisá tu correo o escribinos por WhatsApp.' };
    }
    const ahora = new Date();
    const precios = precioEfectivo(curso as any, fecha as any, ahora);
    if (precios.precio == null) return { error: 'Este curso no tiene precio cargado todavía.' };
    let estado = 'pendiente';
    let ultimo = false;
    if (fecha) {
      const tomados = (await q<{ n: number }>(
        `select count(*)::int as n from reservas where fecha_id = $1 and (estado = 'confirmada' or (estado = 'pendiente' and vence_en > now()))`, [fecha.id]))[0].n;
      const libres = fecha.cupo - tomados;
      if (libres <= 0 && !d.espera) return { error: 'Se completaron los lugares mientras reservabas. Podés anotarte en la lista de espera.' };
      if (libres > 0 && d.espera) return { error: 'Se liberó un lugar: volvé a reservar normalmente.' };
      if (libres <= 0) estado = 'espera';
      ultimo = estado === 'pendiente' && libres === 2; // con esta reserva queda un solo lugar
    }
    const sena = calcularSena(curso as any, precios.precio);
    const modo = d.modo === 'sena' && sena ? 'sena' : 'total';
    const aPagar = modo === 'sena' ? sena! : precios.precio;
    const venceMin = d.metodo === 'mp' ? a.mp_hold_min : a.hold_horas * 60;
    const vence = estado === 'pendiente' ? new Date(ahora.getTime() + venceMin * 60_000).toISOString() : null;
    const fila = await q<{ id: string }>(
      `insert into reservas (codigo, curso_id, fecha_id, nombre, email, tel, primera_vez, acepta_novedades, estado, modo, metodo,
                             monto_total, monto_a_pagar, vence_en, regalo)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::text::jsonb) returning id`,
      [codigo, curso.id, fecha?.id ?? null, d.nombre, d.email, d.tel, d.primeraVez, d.novedades, estado, modo, d.metodo,
       precios.precio, aPagar, vence, d.regalo ? JSON.stringify(d.regalo) : null],
    );
    const titulo = fecha ? `${curso.corto} · ${fechaLarga(new Date(fecha.inicio).toISOString())}` : curso.nombre;
    return { id: fila[0].id, estado, monto: aPagar, titulo, ultimo };
  });
  if ('error' in r) return { ok: false, error: r.error };

  // el origen va aparte de la reserva: es un extra y, si falla (o la columna todavía no existe), la reserva sigue igual
  await query(`update reservas set tracking = $2::text::jsonb where id = $1`,
    [r.id, JSON.stringify({ ...d.rastreo, ip: ip.slice(0, 64), ua: ua.slice(0, 300) })])
    .catch((e) => console.error('No se pudo guardar el origen de la reserva', e));
  await suscribirSiquiere(d.email, d.novedades, 'reserva');
  if (r.estado === 'espera') return { ok: true, url: `/reserva/${codigo}`, codigo };

  /** Si esta reserva dejó la fecha con un solo lugar libre, Steph lo sabe (aparte del aviso de la reserva). Nunca rompe la reserva. */
  const avisarUltimoLugar = async () => {
    if (!r.ultimo) return;
    try {
      await enviarAhora([await encolar(query, { plantilla: 'steph_ultimo_lugar', para: 'steph', reservaId: r.id })]);
    } catch (e) {
      console.error('No se pudo avisar que queda un solo lugar', e);
    }
  };

  if (d.metodo === 'mp') {
    if (simulacroActivo()) {
      await avisarUltimoLugar();
      return { ok: true, url: `/reserva/${codigo}/simulacro`, codigo };
    }
    try {
      const pref = await crearPreferencia({ codigo, titulo: r.titulo, monto: r.monto, nombre: d.nombre, email: d.email, venceMin: a.mp_hold_min });
      await query(`update reservas set mp_preferencia = $2 where id = $1`, [r.id, pref.id]);
      await avisarUltimoLugar();
      return { ok: true, url: pref.url, codigo };
    } catch (e) {
      console.error('No se pudo crear el pago en Mercado Pago', e);
      await query(`update reservas set estado = 'cancelada', vence_en = null where id = $1`, [r.id]);
      return { ok: false, error: 'No pudimos abrir Mercado Pago. Probá de nuevo en unos minutos o elegí transferencia.' };
    }
  }
  // transferencia o pago desde el exterior: queda pendiente hasta que Steph confirme el pago
  const ids = [
    await encolar(query, { plantilla: 'pago_pendiente', para: d.email, reservaId: r.id }),
    await encolar(query, { plantilla: 'steph_reserva', para: 'steph', reservaId: r.id }),
  ];
  await enviarAhora(ids);
  await avisarUltimoLugar();
  return { ok: true, url: `/reserva/${codigo}`, codigo };
}

async function crearConsulta(d: z.output<typeof Reserva>, curso: Record<string, any>): Promise<ResultadoReserva> {
  const fila = await query<{ id: string }>(
    `insert into consultas (nombre, email, tel, curso_id, interes, canal, mensaje) values ($1,$2,$3,$4,$5,'web',$6) returning id`,
    [d.nombre, d.email, d.tel, curso.id, curso.nombre, d.motivo],
  );
  const id = fila[0].id;
  const q = query;
  const ya = [
    await encolar(q, { plantilla: 'consulta_recibida', para: d.email, consultaId: id }),
    await encolar(q, { plantilla: 'steph_consulta', para: 'steph', consultaId: id }),
  ];
  await encolar(q, { plantilla: 'seguimiento', para: d.email, consultaId: id, enviarEn: new Date(Date.now() + 48 * 3600_000) });
  await suscribirSiquiere(d.email, d.novedades, 'consulta');
  await enviarAhora(ya);
  return { ok: true, url: '/consulta-enviada' };
}

export type ResultadoPago = 'confirmada' | 'ya_confirmada' | 'fuera_de_plazo' | 'no_encontrada';

/** Un pago llegó (Mercado Pago o Steph lo marcó a mano). Puede llamarse varias veces con el mismo pago sin duplicar nada. */
export async function confirmarPago(codigo: string, pago: { monto: number; mpPago?: string }): Promise<ResultadoPago> {
  const r = await tx<{ res: ResultadoPago; ids: string[]; reservaId?: string }>(async (q) => {
    const rs = (await q(
      `select r.*, c.kind from reservas r join cursos c on c.id = r.curso_id where r.codigo = $1 for update of r`, [codigo]))[0];
    if (!rs) return { res: 'no_encontrada', ids: [] };
    if (rs.estado === 'confirmada') return { res: 'ya_confirmada', ids: [] };

    // si el plazo venció o se canceló, solo se acepta si el lugar sigue libre
    if (rs.fecha_id && ['expirada', 'cancelada'].includes(rs.estado)) {
      const f = (await q(`select cupo from fechas where id = $1 for update`, [rs.fecha_id]))[0];
      const n = (await q<{ n: number }>(
        `select count(*)::int as n from reservas where fecha_id = $1 and id <> $2 and (estado = 'confirmada' or (estado = 'pendiente' and vence_en > now()))`,
        [rs.fecha_id, rs.id]))[0].n;
      if (!f || f.cupo - n <= 0) {
        await q(`update reservas set monto_pagado = monto_pagado + $2, mp_pago = coalesce($3, mp_pago), updated_at = now() where id = $1`, [rs.id, pago.monto, pago.mpPago ?? null]);
        const id = await encolar(q, { plantilla: 'steph_reserva', para: 'steph', reservaId: rs.id,
          vars: { estado_pago: 'PAGÓ DESPUÉS DE VENCER EL PLAZO y ya no quedan lugares: hay que devolverle el dinero o pasarla a otra fecha' } });
        return { res: 'fuera_de_plazo', ids: [id] };
      }
    }
    const pagado = rs.monto_pagado + pago.monto;
    await q(
      `update reservas set estado = 'confirmada', monto_pagado = $2, vence_en = null, mp_pago = coalesce($3, mp_pago), updated_at = now() where id = $1`,
      [rs.id, pagado, pago.mpPago ?? null]);
    const f = rs.fecha_id ? (await q(`select inicio, fin from fechas where id = $1`, [rs.fecha_id]))[0] : null;
    const ids = await programarConfirmada(q, {
      id: rs.id, email: rs.email, kind: rs.kind,
      inicio: f ? new Date(f.inicio) : null, fin: f?.fin ? new Date(f.fin) : null, regalo: rs.regalo,
    });
    return { res: 'confirmada', ids, reservaId: rs.id };
  });
  await enviarAhora(r.ids);
  if (r.res === 'confirmada' && r.reservaId) await registrarCompra(r.reservaId); // cuenta la venta en Meta y Analytics (solo la primera confirmación)
  return r.res;
}

/** Libera los lugares de reservas pendientes cuyo plazo venció y avisa a la alumna. */
export async function expirarVencidas(): Promise<number> {
  const filas = await query<{ id: string; email: string }>(
    `update reservas set estado = 'expirada', updated_at = now() where estado = 'pendiente' and vence_en < now() returning id, email`);
  for (const f of filas) await encolar(query, { plantilla: 'reserva_liberada', para: f.email, reservaId: f.id });
  return filas.length;
}

