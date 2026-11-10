'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { cerrarSesion, ipActual, iniciarSesion, requerirAdmin } from '@/lib/auth';
import { claveCorrecta, hashClave } from '@/lib/hash';
import { permitir } from '@/lib/limites';
import { query, tx } from '@/lib/db';
import { entero, instanteAR, horaDeInicio, lineas, slugify, texto } from '@/lib/admin-form';
import { normalizarCaratula } from '@/lib/caratula';
import { encolar, enviarAhora } from '@/lib/mail/cola';
import { confirmarPago } from '@/lib/reservas';
import { etiquetaFecha } from '@/lib/format';
import { siteUrl } from '@/lib/ajustes';

export type Estado = { ok?: string; error?: string };

/* ---------- Sesión ---------- */

export async function entrar(_: { error: string; email: string }, f: FormData): Promise<{ error: string; email: string }> {
  const r = await iniciarSesion(texto(f, 'email'), String(f.get('clave') ?? ''), await ipActual());
  if (!r.ok) return { error: r.error, email: texto(f, 'email') };
  redirect('/admin');
}

export async function salir() {
  await cerrarSesion();
  redirect('/admin/login');
}

/** Cada persona cambia su propia clave: pide la actual (por si alguien deja la sesión abierta) y la nueva dos veces. */
export async function cambiarMiClave(_: Estado, f: FormData): Promise<Estado> {
  const a = await requerirAdmin();
  if (!(await permitir(`cambiar-clave:${a.id}`, 6, 900))) return { error: 'Demasiados intentos. Esperá unos minutos y probá de nuevo.' };
  const actual = String(f.get('actual') ?? ''), nueva = String(f.get('nueva') ?? ''), repetir = String(f.get('repetir') ?? '');
  const fila = (await query<{ password_hash: string }>(`select password_hash from admins where id = $1`, [a.id]))[0];
  if (!fila || !claveCorrecta(actual, fila.password_hash)) return { error: 'La clave actual no es correcta.' };
  if (nueva.length < 10) return { error: 'La clave nueva tiene que tener al menos 10 caracteres.' };
  if (nueva === actual) return { error: 'La clave nueva tiene que ser distinta de la actual.' };
  if (nueva !== repetir) return { error: 'Las dos claves nuevas no coinciden.' };
  await query(`update admins set password_hash = $2 where id = $1`, [a.id, hashClave(nueva)]);
  return { ok: 'Listo, cambiaste tu clave. La próxima vez que entres, usá la nueva.' };
}

/* ---------- Reservas ---------- */

export async function marcarPagado(f: FormData) {
  await requerirAdmin({ soloAdmin: true });
  const id = texto(f, 'id');
  const r = (await query(`select codigo, estado, monto_a_pagar, monto_total, monto_pagado from reservas where id = $1`, [id]))[0];
  if (!r) return;
  if (r.estado === 'confirmada') {
    await query(`update reservas set monto_pagado = monto_total, updated_at = now() where id = $1`, [id]); // saldo pagado
  } else {
    await confirmarPago(r.codigo, { monto: r.monto_a_pagar });
  }
  updateTag('catalogo');
  revalidatePath('/admin', 'layout');
}

export async function cancelarReserva(f: FormData) {
  await requerirAdmin({ soloAdmin: true });
  const id = texto(f, 'id');
  await tx(async (q) => {
    await q(`update reservas set estado = 'cancelada', vence_en = null, updated_at = now() where id = $1`, [id]);
    await q(`update mails set estado = 'cancelado', error = 'reserva cancelada' where reserva_id = $1 and estado = 'pendiente'`, [id]);
  });
  updateTag('catalogo');
  revalidatePath('/admin', 'layout');
}

/** Cuando se libera un lugar, avisa a alguien de la lista de espera (aunque el aviso automático esté apagado). */
export async function avisarEspera(f: FormData) {
  await requerirAdmin({ soloAdmin: true });
  const id = texto(f, 'id');
  const r = (await query(`select email from reservas where id = $1 and estado = 'espera'`, [id]))[0];
  if (!r) return;
  const mailId = await encolar(query, { plantilla: 'lista_espera', para: r.email, reservaId: id, vars: { forzar: '1' } });
  await enviarAhora([mailId]);
  revalidatePath('/admin', 'layout');
}

export async function guardarNotaReserva(f: FormData) {
  await requerirAdmin({ soloAdmin: true });
  await query(`update reservas set notas = $2, updated_at = now() where id = $1`, [texto(f, 'id'), texto(f, 'notas').slice(0, 1000)]);
  revalidatePath('/admin/reservas');
}

/* ---------- Consultas ---------- */

const CANALES = ['web', 'instagram', 'whatsapp', 'otro'];
const ESTADOS_CONSULTA = ['nueva', 'en_conversacion', 'reservo', 'no_reservo'];

export async function anotarConsulta(_: Estado, f: FormData): Promise<Estado> {
  await requerirAdmin({ soloAdmin: true });
  const nombre = texto(f, 'nombre');
  if (nombre.length < 2) return { error: 'Escribí el nombre de quien consultó.' };
  const canal = CANALES.includes(texto(f, 'canal')) ? texto(f, 'canal') : 'otro';
  await query(
    `insert into consultas (nombre, email, tel, interes, canal, mensaje, proximo_paso, estado)
     values ($1,$2,$3,$4,$5,$6,$7,'nueva')`,
    [nombre, texto(f, 'email'), texto(f, 'tel'), texto(f, 'interes'), canal, texto(f, 'mensaje'), texto(f, 'proximo_paso')],
  );
  revalidatePath('/admin', 'layout');
  return { ok: 'Consulta anotada.' };
}

export async function actualizarConsulta(f: FormData) {
  await requerirAdmin({ soloAdmin: true });
  const estado = ESTADOS_CONSULTA.includes(texto(f, 'estado')) ? texto(f, 'estado') : 'nueva';
  await query(
    `update consultas set estado = $2, proximo_paso = $3, motivo_no = $4, notas = $5, updated_at = now() where id = $1`,
    [texto(f, 'id'), estado, texto(f, 'proximo_paso').slice(0, 300), texto(f, 'motivo_no').slice(0, 300), texto(f, 'notas').slice(0, 1000)],
  );
  revalidatePath('/admin', 'layout');
}

/* ---------- Cursos y fechas ---------- */

const TIPOS = ['presencial', 'online', '1a1', 'regalo'];

function datosCurso(f: FormData) {
  const tipo = TIPOS.includes(texto(f, 'tipo')) ? texto(f, 'tipo') : 'presencial';
  const kind = tipo === 'regalo' ? 'regalo' : tipo === '1a1' ? (texto(f, 'reserva_como') === 'consulta' ? 'consulta' : 'slot') : 'fecha';
  const senaModo = ['ninguna', 'pct', 'fijo'].includes(texto(f, 'sena_modo')) ? texto(f, 'sena_modo') : 'ninguna';
  return {
    nombre: texto(f, 'nombre'), tipo, kind, lugar: texto(f, 'lugar'), duracion: texto(f, 'duracion'),
    resumen: texto(f, 'resumen'), descripcion: texto(f, 'descripcion'), para_quien: texto(f, 'para_quien'),
    incluye: lineas(f, 'incluye'), programa: lineas(f, 'programa'), que_traer: texto(f, 'que_traer'),
    caratula: JSON.stringify(normalizarCaratula({
      motivo: texto(f, 'caratula_motivo'), paleta: texto(f, 'caratula_paleta'),
      titulo: texto(f, 'caratula_titulo'), detalle: texto(f, 'caratula_detalle'),
    }, tipo)),
    precio: entero(f, 'precio'), precio_lista: entero(f, 'precio_lista'),
    sena_modo: senaModo, sena_valor: senaModo === 'ninguna' ? 0 : entero(f, 'sena_valor') ?? 0,
    medios: ['todos', 'mp', 'transferencia'].includes(texto(f, 'medios')) ? texto(f, 'medios') : 'todos',
  };
}

type DatosFecha = {
  inicio: Date; fin: Date | null; hora: string; otras: string; cupo: number; repite: string; estado: string; publicarEn: Date | null;
  precio: number | null; precioLista: number | null; precioHasta: Date | null; linkOnline: string; direccion: string; edicion: string;
};

function datosFecha(f: FormData, kind: string): DatosFecha | string {
  const fecha = texto(f, 'fecha');
  const hora = texto(f, 'hora');
  const hh = horaDeInicio(hora);
  if (!hh) return 'Escribí el horario así: 11:00 a 13:30 (la web usa la primera hora para ordenar y avisar).';
  const inicio = instanteAR(fecha, hh);
  if (!inicio) return 'Elegí la fecha.';
  const cupo = kind === 'slot' ? 1 : entero(f, 'cupo') ?? 0;
  if (cupo < 1) return 'Indicá cuántos lugares hay (al menos 1).';
  const finFecha = texto(f, 'fin_fecha');
  const fin = finFecha ? instanteAR(finFecha, hh) : null;
  if (fin && fin < inicio) return 'La última clase no puede ser antes que la primera.';
  const pub = texto(f, 'publicacion');
  const publicarFecha = texto(f, 'publicar_fecha');
  if (pub === 'programar' && !instanteAR(publicarFecha, '08:00')) return 'Elegí desde qué día se publica.';
  const hasta = texto(f, 'precio_hasta');
  return {
    inicio, fin, hora, otras: texto(f, 'otras_clases'), cupo,
    repite: ['no', 'mensual', 'quincenal'].includes(texto(f, 'repite')) ? texto(f, 'repite') : 'no',
    estado: pub === 'ahora' ? 'abierta' : 'borrador',
    publicarEn: pub === 'programar' ? instanteAR(publicarFecha, '08:00') : null,
    precio: entero(f, 'fecha_precio'), precioLista: entero(f, 'fecha_precio_lista'),
    precioHasta: hasta ? instanteAR(hasta, '23:59') : null,
    linkOnline: texto(f, 'link_online'), direccion: texto(f, 'direccion'), edicion: texto(f, 'edicion'),
  };
}

async function avisarListaEspera(cursoId: string, fecha: Date, otras: string) {
  const p = (await query(`select activa from plantillas_mail where clave = 'lista_espera'`))[0];
  if (!p?.activa) return;
  const c = (await query(`select nombre, slug from cursos where id = $1`, [cursoId]))[0];
  const destinos = await query<{ email: string; nombre: string | null }>(
    `select distinct on (lower(email)) email, nombre from (
        select email, split_part(nombre, ' ', 1) as nombre from reservas where curso_id = $1 and estado = 'espera'
        union all select email, null from suscriptores where origen = 'espera' and baja_en is null) x
      order by lower(email)`, [cursoId]);
  const vars = { curso: c.nombre, fecha: etiquetaFecha({ inicio: fecha.toISOString(), otrasClases: otras }), link: `${siteUrl()}/cursos/${c.slug}` };
  const ids: string[] = [];
  for (const d of destinos) ids.push(await encolar(query, { plantilla: 'lista_espera', para: d.email, vars: { ...vars, nombre: d.nombre ?? '' } }));
  await enviarAhora(ids);
}

export async function guardarCurso(_: Estado, f: FormData): Promise<Estado> {
  await requerirAdmin({ soloAdmin: true });
  const id = texto(f, 'id');
  const c = datosCurso(f);
  if (c.nombre.length < 3) return { error: 'Escribí el nombre del curso.' };
  if (!c.resumen) return { error: 'Escribí una descripción corta: es lo que ve la alumna en la tarjeta.' };
  if (c.kind !== 'consulta' && c.precio == null) return { error: 'Indicá el precio actual.' };
  const conFecha = !id && (c.kind === 'fecha' || c.kind === 'slot');
  let fe: DatosFecha | null = null;
  if (conFecha) {
    const r = datosFecha(f, c.kind);
    if (typeof r === 'string') return { error: r };
    fe = r;
  }
  const cols = [c.nombre, c.tipo, c.kind, c.lugar, c.duracion, c.resumen, c.descripcion, c.para_quien, c.incluye, c.programa, c.que_traer,
    c.caratula, c.precio, c.precio_lista, c.sena_modo, c.sena_valor, c.medios];
  let cursoId = id;
  if (id) {
    await query(
      `update cursos set nombre=$2, tipo=$3, kind=$4, lugar=$5, duracion=$6, resumen=$7, descripcion=$8, para_quien=$9, incluye=$10::text[], programa=$11::text[],
         que_traer=$12, caratula=$13::text::jsonb, precio=$14, precio_lista=$15, sena_modo=$16, sena_valor=$17, medios=$18,
         corto = case when corto = nombre then $2 else corto end, updated_at=now() where id=$1`,
      [id, ...cols]);
  } else {
    const base = slugify(c.nombre);
    const existe = await query(`select slug from cursos where slug = $1 or slug like $2`, [base, `${base}-%`]);
    const slug = existe.length ? `${base}-${existe.length + 1}` : base;
    const orden = (await query<{ n: number }>(`select coalesce(max(orden), 0)::int + 1 as n from cursos`))[0].n;
    const r = await query<{ id: string }>(
      `insert into cursos (slug, nombre, corto, tipo, kind, lugar, duracion, resumen, descripcion, para_quien, incluye, programa, que_traer,
         caratula, precio, precio_lista, sena_modo, sena_valor, medios, orden)
       values ($1,$2,$2,$3,$4,$5,$6,$7,$8,$9,$10::text[],$11::text[],$12,$13::text::jsonb,$14,$15,$16,$17,$18,$19) returning id`,
      [slug, c.nombre, c.tipo, c.kind, c.lugar, c.duracion, c.resumen, c.descripcion, c.para_quien,
       c.incluye, c.programa, c.que_traer, c.caratula, c.precio, c.precio_lista, c.sena_modo, c.sena_valor, c.medios, orden]);
    cursoId = r[0].id;
  }
  if (fe) {
    const hasta = fe.precioHasta;
    await query(
      `insert into fechas (curso_id, edicion, inicio, fin, hora, otras_clases, cupo, precio, precio_lista, precio_hasta, link_online, direccion, repite, estado, publicar_en)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [cursoId, fe.edicion, fe.inicio.toISOString(), fe.fin?.toISOString() ?? null, fe.hora, fe.otras, fe.cupo,
       hasta ? c.precio : null, hasta ? c.precio_lista : null, hasta?.toISOString() ?? null,
       fe.linkOnline, fe.direccion, fe.repite, fe.estado, fe.publicarEn?.toISOString() ?? null]);
    if (fe.estado === 'abierta' && texto(f, 'avisar_espera')) await avisarListaEspera(cursoId, fe.inicio, fe.otras);
  }
  updateTag('catalogo');
  redirect(id ? `/admin/cursos/${id}?ok=1` : '/admin/cursos?ok=creado');
}

export async function guardarFecha(_: Estado, f: FormData): Promise<Estado> {
  await requerirAdmin({ soloAdmin: true });
  const cursoId = texto(f, 'curso_id');
  const fechaId = texto(f, 'fecha_id');
  const curso = (await query(`select kind from cursos where id = $1`, [cursoId]))[0];
  if (!curso) return { error: 'No encontré el curso.' };
  const d = datosFecha(f, curso.kind);
  if (typeof d === 'string') return { error: d };
  const vals = [d.edicion, d.inicio.toISOString(), d.fin?.toISOString() ?? null, d.hora, d.otras, d.cupo, d.precio, d.precioLista,
    d.precioHasta?.toISOString() ?? null, d.linkOnline, d.direccion, d.repite, d.estado, d.publicarEn?.toISOString() ?? null];
  if (fechaId) {
    await query(
      `update fechas set edicion=$2, inicio=$3, fin=$4, hora=$5, otras_clases=$6, cupo=$7, precio=$8, precio_lista=$9, precio_hasta=$10,
         link_online=$11, direccion=$12, repite=$13, estado=$14, publicar_en=$15, updated_at=now() where id=$1 and curso_id=$16`,
      [fechaId, ...vals, cursoId]);
  } else {
    await query(
      `insert into fechas (curso_id, edicion, inicio, fin, hora, otras_clases, cupo, precio, precio_lista, precio_hasta, link_online, direccion, repite, estado, publicar_en)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`, [cursoId, ...vals]);
    if (d.estado === 'abierta' && texto(f, 'avisar_espera')) await avisarListaEspera(cursoId, d.inicio, d.otras);
  }
  updateTag('catalogo');
  revalidatePath('/admin', 'layout');
  return { ok: fechaId ? 'Fecha guardada.' : 'Fecha agregada.' };
}

export async function cambiarEstadoFecha(f: FormData) {
  await requerirAdmin({ soloAdmin: true });
  const estado = ['abierta', 'cerrada', 'borrador'].includes(texto(f, 'estado')) ? texto(f, 'estado') : 'borrador';
  await query(`update fechas set estado = $2, publicar_en = null, updated_at = now() where id = $1`, [texto(f, 'id'), estado]);
  updateTag('catalogo');
  revalidatePath('/admin', 'layout');
}

/** Copia una fecha un mes después (mismo día de la semana y orden en el mes), como borrador para revisar. */
export async function duplicarFecha(f: FormData) {
  await requerirAdmin({ soloAdmin: true });
  const { mismoDiaMesSiguiente } = await import('@/lib/repeticiones');
  const o = (await query(`select * from fechas where id = $1`, [texto(f, 'id')]))[0];
  if (!o) return;
  const nueva = mismoDiaMesSiguiente(new Date(o.inicio));
  const delta = nueva.getTime() - new Date(o.inicio).getTime();
  await query(
    `insert into fechas (curso_id, edicion, inicio, fin, hora, otras_clases, cupo, precio, precio_lista, link_online, direccion, repite, estado)
     values ($1,$2,$3,$4,$5,'',$6,$7,$8,$9,$10,$11,'borrador')`,
    [o.curso_id, '', nueva.toISOString(), o.fin ? new Date(new Date(o.fin).getTime() + delta).toISOString() : null, o.hora, o.cupo,
     o.precio, o.precio_lista, o.link_online, o.direccion, o.repite]);
  revalidatePath('/admin', 'layout');
  redirect(`/admin/cursos/${o.curso_id}?ok=duplicada`);
}

export async function activarCurso(f: FormData) {
  await requerirAdmin({ soloAdmin: true });
  await query(`update cursos set activo = $2, updated_at = now() where id = $1`, [texto(f, 'id'), texto(f, 'activo') === '1']);
  updateTag('catalogo');
  revalidatePath('/admin', 'layout');
}

/* ---------- Mails ---------- */

export async function guardarPlantilla(_: Estado, f: FormData): Promise<Estado> {
  await requerirAdmin({ soloAdmin: true });
  const asunto = texto(f, 'asunto'), cuerpo = String(f.get('cuerpo') ?? '').trim();
  if (!asunto || !cuerpo) return { error: 'El asunto y el texto no pueden quedar vacíos.' };
  await query(`update plantillas_mail set asunto = $2, cuerpo = $3, updated_at = now() where clave = $1`, [texto(f, 'clave'), asunto.slice(0, 200), cuerpo.slice(0, 5000)]);
  revalidatePath('/admin/mails');
  return { ok: 'Guardado.' };
}

export async function alternarPlantilla(f: FormData) {
  await requerirAdmin({ soloAdmin: true });
  await query(`update plantillas_mail set activa = not activa, updated_at = now() where clave = $1`, [texto(f, 'clave')]);
  revalidatePath('/admin/mails');
}

export async function reenviarMail(f: FormData) {
  await requerirAdmin({ soloAdmin: true });
  await query(`update mails set estado = 'pendiente', intentos = 0, reclamado_en = null, enviar_en = now(), error = null where id = $1 and estado in ('error','cancelado')`, [texto(f, 'id')]);
  const { procesarCola } = await import('@/lib/mail/cola');
  await procesarCola(5);
  revalidatePath('/admin/mails');
}

/* ---------- Ajustes ---------- */

export async function guardarAjustes(_: Estado, f: FormData): Promise<Estado> {
  await requerirAdmin({ soloAdmin: true });
  const mail = texto(f, 'mail_steph');
  if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) return { error: 'Revisá tu email de avisos.' };
  const rem = texto(f, 'remitente_email');
  if (rem && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(rem)) return { error: 'Revisá el email desde el que salen los avisos.' };
  const wa = texto(f, 'whatsapp').replace(/\D/g, '');
  const valores: Record<string, unknown> = {
    mail_steph: mail, remitente_email: rem, remitente_nombre: texto(f, 'remitente_nombre') || 'Moda con Steph',
    whatsapp: wa, instagram: texto(f, 'instagram').replace(/^@/, ''), link_resena: texto(f, 'link_resena'),
    direccion_estudio: texto(f, 'direccion_estudio'), politica_cambios: texto(f, 'politica_cambios'),
    hold_horas: Math.min(168, Math.max(1, entero(f, 'hold_horas') ?? 24)),
    mp_hold_min: Math.min(240, Math.max(15, entero(f, 'mp_hold_min') ?? 60)),
    transferencia: { titular: texto(f, 't_titular'), cuit: texto(f, 't_cuit'), banco: texto(f, 't_banco'), cbu: texto(f, 't_cbu'), alias: texto(f, 't_alias') },
    exterior: { instrucciones: texto(f, 'ex_instrucciones'), link: texto(f, 'ex_link') },
  };
  for (const [k, v] of Object.entries(valores)) {
    await query(`insert into ajustes (clave, valor) values ($1, $2::text::jsonb) on conflict (clave) do update set valor = excluded.valor`, [k, JSON.stringify(v)]);
  }
  updateTag('ajustes');
  return { ok: 'Ajustes guardados.' };
}

