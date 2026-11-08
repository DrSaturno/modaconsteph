import 'server-only';
import { query, type Query } from '../db';
import { leerAjustes, siteUrl } from '../ajustes';
import { etiquetaFecha, momento, peso } from '../format';
import { enviarCorreo } from './enviar';
import { aHtml, sustituir } from './plantillas';

type Nuevo = {
  plantilla: string; para: string; reservaId?: string; consultaId?: string; enviarEn?: Date; vars?: Record<string, string>;
};

export async function encolar(q: Query, m: Nuevo): Promise<string> {
  const r = await q<{ id: string }>(
    `insert into mails (plantilla, para, reserva_id, consulta_id, enviar_en, vars) values ($1,$2,$3,$4,$5,$6::text::jsonb) returning id`,
    [m.plantilla, m.para, m.reservaId ?? null, m.consultaId ?? null, (m.enviarEn ?? new Date()).toISOString(), JSON.stringify(m.vars ?? {})],
  );
  return r[0].id;
}

/** Las 8 de la mañana de Buenos Aires, `dias` días después (o antes) del día de `base`. Argentina no usa horario de verano (UTC-3). */
export function ocho(base: Date, dias: number): Date {
  const ar = new Date(base.getTime() - 3 * 3600_000);
  return new Date(Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth(), ar.getUTCDate() + dias, 8 + 3, 0, 0));
}

const telLindo = (wa: string) => (wa.startsWith('549') ? wa.slice(3).replace(/^(\d{2})(\d{4})(\d{4})$/, '$1 $2-$3') : wa);

/** Todos los datos que un mail puede nombrar, leídos al momento de enviar (si Steph cambia la hora, el mail sale con la hora nueva). */
export async function armarVars(opts: { reservaId?: string | null; consultaId?: string | null }, extra: Record<string, string> = {}) {
  const a = await leerAjustes();
  const v: Record<string, string> = {
    whatsapp: telLindo(a.whatsapp), link_resena: a.link_resena, panel: `${siteUrl()}/admin`, politica_cambios: a.politica_cambios,
    link: siteUrl(),
  };
  if (opts.reservaId) {
    const r = (await query(
      `select r.*, c.nombre as curso, c.corto, c.lugar, c.que_traer, c.tipo, c.slug, c.kind,
              f.inicio, f.hora, f.otras_clases, f.cupo, f.link_online, f.direccion, f.libres
         from reservas r join cursos c on c.id = r.curso_id left join fechas_cupo f on f.id = r.fecha_id where r.id = $1`,
      [opts.reservaId],
    ))[0];
    if (r) {
      const primer = String(r.nombre).trim().split(/\s+/)[0];
      const resto = r.monto_total - r.monto_pagado;
      const t = a.transferencia;
      const reg = r.regalo as { para?: string; mensaje?: string; envio?: string } | null;
      Object.assign(v, {
        nombre: primer, nombre_completo: r.nombre, email: r.email, tel: r.tel,
        curso: r.curso, curso_corto: r.corto, lugar: r.lugar, materiales: r.que_traer || 'Nada en especial.',
        fecha: r.inicio ? etiquetaFecha({ inicio: new Date(r.inicio).toISOString(), otrasClases: r.otras_clases ?? '' }) : '',
        hora: r.hora ?? '', libres: String(r.libres ?? ''), cupo: String(r.cupo ?? ''),
        codigo: r.codigo, monto: peso(r.monto_a_pagar), vence: r.vence_en ? momento(new Date(r.vence_en).toISOString()) : '',
        resto_linea: r.modo === 'sena' && r.monto_pagado > 0 && resto > 0
          ? `Pagaste ${peso(r.monto_pagado)} de ${peso(r.monto_total)}. El resto (${peso(resto)}) lo abonás antes de la clase.` : '',
        datos_transferencia: [t.titular && `Titular: ${t.titular}`, t.cuit && `CUIT/CUIL: ${t.cuit}`, t.banco && `Banco: ${t.banco}`, t.cbu && `CBU: ${t.cbu}`, t.alias && `Alias: ${t.alias}`]
          .filter(Boolean).join('\n') || '(Steph te pasa los datos por WhatsApp)',
        como_llegar: r.tipo === 'online'
          ? (r.link_online ? `Link de la clase: ${r.link_online}` : 'Te paso el link de la clase por acá antes de empezar.')
          : `Dirección: ${r.direccion || a.direccion_estudio}`,
        estado_pago: r.estado === 'confirmada' ? (resto > 0 ? `seña de ${peso(r.monto_pagado)}, resta ${peso(resto)}` : `pagó el total (${peso(r.monto_pagado)})`)
          : r.estado === 'espera' ? 'en lista de espera' : `falta el pago de ${peso(r.monto_a_pagar)} (${r.metodo})`,
        link: r.slug ? `${siteUrl()}/cursos/${r.slug}` : siteUrl(),
        quien_regala: r.nombre, quien_recibe: reg?.para ?? '', mensaje: reg?.mensaje ?? '',
        cuando_envio: reg?.envio ? `el ${reg.envio}` : 'ahora mismo',
      });
    }
  }
  if (opts.consultaId) {
    const c = (await query(
      `select q.*, c.nombre as curso from consultas q left join cursos c on c.id = q.curso_id where q.id = $1`, [opts.consultaId],
    ))[0];
    if (c) {
      Object.assign(v, {
        nombre: String(c.nombre).trim().split(/\s+/)[0], nombre_completo: c.nombre, email: c.email, tel: c.tel,
        curso: c.curso ?? c.interes ?? 'tu consulta', motivo: c.mensaje || '(sin mensaje)',
      });
    }
  }
  return { ...v, ...extra };
}

const SOLO_CONFIRMADAS = ['recordatorio', 'aviso_dia', 'resena', 'invitacion_siguiente'];

/** Envía un mail de la cola. Seguro de llamar dos veces: el segundo intento no hace nada. */
export async function enviarMail(id: string): Promise<'enviado' | 'omitido' | 'error' | 'ocupado'> {
  const claim = await query(
    `update mails set reclamado_en = now() where id = $1 and estado = 'pendiente'
       and (reclamado_en is null or reclamado_en < now() - interval '10 minutes') returning *`, [id]);
  const m = claim[0];
  if (!m) return 'ocupado';
  const omitir = async (motivo: string) => {
    await query(`update mails set estado = 'cancelado', error = $2, reclamado_en = null where id = $1`, [id, motivo]);
    return 'omitido' as const;
  };
  try {
    const p = (await query(`select * from plantillas_mail where clave = $1`, [m.plantilla]))[0];
    if (!p || (!p.activa && (m.vars as Record<string, string> | null)?.forzar !== '1')) return await omitir('plantilla apagada');
    if (m.reserva_id) {
      const r = (await query(`select estado from reservas where id = $1`, [m.reserva_id]))[0];
      if (!r) return await omitir('reserva borrada');
      if (SOLO_CONFIRMADAS.includes(m.plantilla) && r.estado !== 'confirmada') return await omitir('la reserva ya no está confirmada');
      if (m.plantilla === 'pago_pendiente' && r.estado !== 'pendiente') return await omitir('la reserva ya no está pendiente');
    }
    if (m.consulta_id && m.plantilla === 'seguimiento') {
      const c = (await query(`select estado from consultas where id = $1`, [m.consulta_id]))[0];
      if (!c || ['reservo', 'no_reservo'].includes(c.estado)) return await omitir('la consulta ya está resuelta');
    }
    const a = await leerAjustes();
    let para = m.para as string;
    if (p.destino === 'steph') para = a.mail_steph;
    if (!para) return await omitir('no hay mail de destino');
    const vars = await armarVars({ reservaId: m.reserva_id, consultaId: m.consulta_id }, (m.vars ?? {}) as Record<string, string>);
    const texto = sustituir(p.cuerpo, vars);
    const asunto = sustituir(p.asunto, vars);
    await enviarCorreo({
      de: { nombre: a.remitente_nombre, email: a.remitente_email || 'dev@localhost' },
      para, asunto, texto, html: aHtml(texto, asunto),
      responderA: a.mail_steph || undefined,
    });
    await query(`update mails set estado = 'enviado', enviado_en = now(), error = null, reclamado_en = null where id = $1`, [id]);
    return 'enviado';
  } catch (e) {
    const intentos = (m.intentos as number) + 1;
    await query(
      `update mails set intentos = $2, estado = $3, error = $4, reclamado_en = null, enviar_en = now() + make_interval(mins => $5) where id = $1`,
      [id, intentos, intentos >= 5 ? 'error' : 'pendiente', String((e as Error).message).slice(0, 500), intentos * 15],
    );
    return 'error';
  }
}

export async function procesarCola(max = 40): Promise<{ enviados: number; omitidos: number; errores: number }> {
  const due = await query<{ id: string }>(
    `select id from mails where estado = 'pendiente' and enviar_en <= now() order by enviar_en limit $1`, [max]);
  const res = { enviados: 0, omitidos: 0, errores: 0 };
  for (const { id } of due) {
    const r = await enviarMail(id);
    if (r === 'enviado') res.enviados++;
    else if (r === 'omitido') res.omitidos++;
    else if (r === 'error') res.errores++;
  }
  return res;
}

/** Manda ya los mails recién creados (los de después los envía el cron). Si falla, queda en la cola para reintentar. */
export async function enviarAhora(ids: string[]): Promise<void> {
  for (const id of ids) await enviarMail(id).catch(() => undefined);
}

/** Qué mails salen cuando una reserva queda confirmada. Devuelve los que hay que mandar ya. */
export async function programarConfirmada(q: Query, r: {
  id: string; email: string; kind: string; inicio: Date | null; fin: Date | null; regalo: { paraEmail?: string; envio?: string } | null;
}): Promise<string[]> {
  const ahora = new Date();
  const ya: string[] = [];
  if (r.kind === 'regalo') {
    ya.push(await encolar(q, { plantilla: 'regalo_comprobante', para: r.email, reservaId: r.id }));
    if (r.regalo?.paraEmail) {
      const cuando = r.regalo.envio ? ocho(new Date(`${r.regalo.envio}T12:00:00-03:00`), 0) : ahora;
      const id = await encolar(q, { plantilla: 'regalo_destinatario', para: r.regalo.paraEmail, reservaId: r.id, enviarEn: cuando > ahora ? cuando : ahora });
      if (cuando <= ahora) ya.push(id);
    }
  } else {
    ya.push(await encolar(q, { plantilla: 'confirmacion', para: r.email, reservaId: r.id }));
    if (r.inicio) {
      const ultima = r.fin ?? r.inicio;
      const prog: [string, Date][] = [
        ['recordatorio', ocho(r.inicio, -2)], ['aviso_dia', ocho(r.inicio, 0)],
        ['resena', ocho(ultima, 1)], ['invitacion_siguiente', ocho(ultima, 0)],
      ];
      for (const [plantilla, cuando] of prog) if (cuando > ahora) await encolar(q, { plantilla, para: r.email, reservaId: r.id, enviarEn: cuando });
    }
  }
  ya.push(await encolar(q, { plantilla: 'steph_reserva', para: 'steph', reservaId: r.id }));
  return ya;
}
