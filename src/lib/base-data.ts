import { hashClave } from './hash';
import type { Query } from './db';

/* Datos que la web necesita para funcionar (mails, ajustes) y el catálogo actual de Steph. */

type Plantilla = {
  clave: string; nombre: string; cuando: string; destino: 'alumna' | 'steph' | 'regalo';
  activa: boolean; asunto: string; cuerpo: string;
};

// Las 8 primeras son las que Steph aprobó en el panel; el resto son avisos que la web necesita para funcionar.
export const PLANTILLAS: Plantilla[] = [
  { clave: 'confirmacion', nombre: 'Confirmación de reserva', cuando: 'Apenas la alumna reserva', destino: 'alumna', activa: true,
    asunto: 'Tu lugar está reservado: [curso]',
    cuerpo: `Hola [nombre],

Tu lugar en [curso] quedó confirmado. Te esperamos el [fecha].

Horario: [hora]
Dónde: [lugar]. La dirección exacta te llega el mismo día de la clase.
Qué traer: [materiales]

[resto_linea]

Si necesitás cambiar de fecha, respondé este mail o escribime por WhatsApp al [whatsapp].

Gracias por sumarte. Nos vemos pronto.
Steph` },
  { clave: 'recordatorio', nombre: 'Recordatorio de la clase', cuando: '48 horas antes', destino: 'alumna', activa: true,
    asunto: 'En dos días es tu clase de [curso]',
    cuerpo: `Hola [nombre],

En dos días es tu clase de [curso]: [fecha].

Horario: [hora]
Qué traer: [materiales]

Si no vas a poder venir, avisame lo antes posible así puedo ofrecer tu lugar a otra alumna.

Steph` },
  { clave: 'aviso_dia', nombre: 'Aviso el día de la clase', cuando: 'La mañana de la clase', destino: 'alumna', activa: true,
    asunto: 'Hoy es tu clase de [curso]',
    cuerpo: `Hola [nombre],

Hoy es tu clase de [curso].

Horario: [hora]
[como_llegar]

Steph` },
  { clave: 'resena', nombre: 'Pedido de reseña', cuando: '1 día después de la clase', destino: 'alumna', activa: true,
    asunto: '¿Cómo te fue en [curso]?',
    cuerpo: `Hola [nombre],

Gracias por venir a [curso]. ¿Cómo te fue?

Si te gustó, contale a otras chicas dejando tu reseña en Google. Me ayuda muchísimo:
[link_resena]

Steph` },
  { clave: 'seguimiento', nombre: 'Seguimiento a quien preguntó y no reservó', cuando: '48 horas después de la consulta', destino: 'alumna', activa: true,
    asunto: '¿Seguimos con tu consulta?',
    cuerpo: `Hola [nombre],

Te escribo por la consulta que dejaste sobre [curso]. ¿Te sirve que coordinemos la entrevista inicial?

Respondé este mail o escribime por WhatsApp al [whatsapp].

Steph` },
  { clave: 'invitacion_siguiente', nombre: 'Invitación al curso del mes siguiente', cuando: 'En la última clase de cada curso', destino: 'alumna', activa: true,
    asunto: 'Ya está abierta la inscripción de [curso_siguiente]',
    cuerpo: `Hola [nombre],

Ya está abierta la inscripción de [curso_siguiente] ([fecha_siguiente]). Si te anotás hoy, mantenés el precio.

Reservá tu lugar acá: [link]

Steph` },
  { clave: 'lista_espera', nombre: 'Aviso a la lista de espera', cuando: 'Cuando se abre una nueva fecha', destino: 'alumna', activa: false,
    asunto: 'Se abrió una nueva fecha de [curso]',
    cuerpo: `Hola [nombre],

Se abrió una nueva fecha de [curso]: [fecha]. Los lugares son pocos, reservá el tuyo:
[link]

Steph` },
  { clave: 'regalo_destinatario', nombre: 'Gift card para quien la recibe', cuando: 'En la fecha que elige quien regala', destino: 'regalo', activa: true,
    asunto: '[quien_regala] te regaló una experiencia con Steph',
    cuerpo: `Hola [nombre],

[quien_regala] te regaló una experiencia con Steph:

“[mensaje]”

Para elegir tu fecha, escribime por WhatsApp al [whatsapp] con este código: [codigo]

Steph` },
  // avisos que la web necesita para funcionar
  { clave: 'pago_pendiente', nombre: 'Datos para pagar por transferencia', cuando: 'Cuando la alumna elige transferencia', destino: 'alumna', activa: true,
    asunto: 'Te guardamos el lugar en [curso]: falta tu pago',
    cuerpo: `Hola [nombre],

Te guardamos el lugar en [curso] ([fecha], [hora]) hasta el [vence].

Para confirmarlo, transferí [monto] a:
[datos_transferencia]

Cuando transfieras, respondé este mail con el comprobante o mandalo por WhatsApp al [whatsapp]. En cuanto lo vea, te llega la confirmación.

Si el pago no llega antes de esa hora, el lugar se libera para otra alumna.

Steph` },
  { clave: 'reserva_liberada', nombre: 'Lugar liberado por falta de pago', cuando: 'Cuando vence el plazo sin pago', destino: 'alumna', activa: true,
    asunto: 'Liberamos tu lugar en [curso]',
    cuerpo: `Hola [nombre],

Como no recibimos el pago a tiempo, el lugar en [curso] se liberó. Si todavía querés cursar, podés reservar de nuevo mientras queden lugares:
[link]

Steph` },
  { clave: 'consulta_recibida', nombre: 'Consulta recibida', cuando: 'Apenas la alumna deja su consulta', destino: 'alumna', activa: true,
    asunto: 'Recibimos tu consulta',
    cuerpo: `Hola [nombre],

Recibimos tu consulta sobre [curso]. Te escribo en los próximos días para coordinar la entrevista inicial.

Steph` },
  { clave: 'regalo_comprobante', nombre: 'Comprobante para quien regala', cuando: 'Apenas se confirma el pago del regalo', destino: 'alumna', activa: true,
    asunto: 'Tu regalo para [quien_recibe] está confirmado',
    cuerpo: `Hola [nombre],

Tu gift card para [quien_recibe] quedó confirmada ([monto]). Se la enviamos [cuando_envio].

Código: [codigo]

Gracias por regalar una experiencia.
Steph` },
  { clave: 'steph_reserva', nombre: 'Aviso a Steph: nueva reserva', cuando: 'Cada vez que entra una reserva', destino: 'steph', activa: true,
    asunto: 'Nueva reserva: [nombre] · [curso]',
    cuerpo: `[nombre] ([email] · [tel]) reservó [curso] para el [fecha].

Pago: [estado_pago]
Lugares libres: [libres] de [cupo]

Verla en el panel: [panel]` },
  { clave: 'steph_consulta', nombre: 'Aviso a Steph: nueva consulta', cuando: 'Cada vez que entra una consulta', destino: 'steph', activa: true,
    asunto: 'Nueva consulta de [nombre]',
    cuerpo: `[nombre] dejó una consulta sobre [curso].

Qué quiere cambiar o descubrir: [motivo]

Contacto: [email] · [tel]

Verla en el panel: [panel]` },
];

export const AJUSTES: Record<string, unknown> = {
  hold_horas: 24,
  mp_hold_min: 60,
  whatsapp: '5491164627064',
  mail_steph: '',
  remitente_nombre: 'Moda con Steph',
  remitente_email: '',
  direccion_estudio: "O'Higgins 1665, Belgrano, CABA",
  link_resena: 'https://share.google/yaSboxI2nKOzGTR83',
  instagram: '',
  transferencia: { titular: '', cuit: '', banco: '', cbu: '', alias: '' },
  exterior: { instrucciones: '', link: '' },
  // A confirmar con Steph: es un texto base, no una política acordada.
  politica_cambios: 'Podés reprogramar avisando con anticipación. Si no podés venir y avisás a tiempo, tu lugar pasa a otra fecha sin costo.',
};

export async function cargarBase(q: Query) {
  let i = 0;
  for (const p of PLANTILLAS) {
    await q(
      `insert into plantillas_mail (clave, nombre, cuando, destino, activa, asunto, cuerpo, orden)
       values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (clave) do nothing`,
      [p.clave, p.nombre, p.cuando, p.destino, p.activa, p.asunto, p.cuerpo, i++],
    );
  }
  for (const [clave, valor] of Object.entries(AJUSTES)) {
    await q(`insert into ajustes (clave, valor) values ($1, $2::text::jsonb) on conflict (clave) do nothing`, [clave, JSON.stringify(valor)]);
  }
}

/* Catálogo: lo que Steph ofrece hoy en la web actual (precios y textos tomados de ahí). */
type CursoSeed = {
  slug: string; nombre: string; corto: string; tipo: string; kind: string; lugar: string; duracion: string;
  resumen: string; incluye: string[]; que_traer: string; caratula: { motivo: string; paleta: string };
  precio: number | null; precio_lista: number | null; sena_modo: string; sena_valor: number; orden: number;
};
export const CURSOS_SEED: CursoSeed[] = [
  { slug: 'taller-automaquillaje-colorimetria', nombre: 'Taller de automaquillaje y colorimetría', corto: 'Taller de automaquillaje', tipo: 'presencial', kind: 'fecha',
    lugar: 'Estudio en Belgrano, CABA', duracion: '2 h 30',
    resumen: 'Una experiencia práctica en un grupo de hasta 4 alumnas: revisión de neceser, automaquillaje y diagnóstico de colorimetría personal.',
    incluye: ['Revisión de tu neceser', 'Práctica de automaquillaje', 'Diagnóstico de colorimetría personal'], que_traer: 'Tu neceser.',
    caratula: { motivo: 'abanico', paleta: 'luz' }, precio: 75000, precio_lista: 85000, sena_modo: 'pct', sena_valor: 30, orden: 1 },
  { slug: 'colorimetria-avanzada', nombre: 'Colorimetría avanzada', corto: 'Colorimetría avanzada', tipo: 'online', kind: 'fecha',
    lugar: 'Online, en vivo', duracion: '4 clases de 1 h 30',
    resumen: 'Formación intensiva online de 4 clases para profundizar en el diagnóstico cromático, las mezclas de pigmentos y el ajuste de tonos.',
    incluye: ['4 clases en vivo', 'Material digital', 'Certificado'], que_traer: 'El material lo recibís en tu cuenta.',
    caratula: { motivo: 'mezcla', paleta: 'ciruela' }, precio: 83000, precio_lista: 95000, sena_modo: 'pct', sena_valor: 30, orden: 2 },
  { slug: 'sesion-automaquillaje', nombre: 'Sesión de automaquillaje', corto: 'Sesión de automaquillaje', tipo: '1a1', kind: 'slot',
    lugar: 'Estudio en Belgrano, CABA', duracion: '2 h',
    resumen: 'Aprendé a maquillarte según tus rasgos, tu estilo y tus necesidades en una sesión personalizada de 2 horas. Descubrí las técnicas, colores y productos ideales para potenciar tu belleza de forma práctica y sencilla.',
    incluye: [], que_traer: 'Tu neceser.', caratula: { motivo: 'espejo', paleta: 'berry' }, precio: 135000, precio_lista: null, sena_modo: 'pct', sena_valor: 30, orden: 3 },
  { slug: 'sesion-integral', nombre: 'Automaquillaje, estilismo y colorimetría', corto: 'Sesión integral', tipo: '1a1', kind: 'slot',
    lugar: 'Estudio en Belgrano, CABA', duracion: 'A coordinar',
    resumen: 'Trabajaremos sobre el autoconocimiento estético, combinando la teoría del color con la práctica de automaquillaje.',
    incluye: [], que_traer: 'Tu neceser.', caratula: { motivo: 'arco', paleta: 'rosa' }, precio: 165000, precio_lista: null, sena_modo: 'pct', sena_valor: 30, orden: 4 },
  { slug: 'asesoria-imagen', nombre: 'Asesoría de imagen integral', corto: 'Asesoría de imagen', tipo: '1a1', kind: 'consulta',
    lugar: 'Virtual', duracion: 'Entrevista inicial',
    resumen: 'Una experiencia personalizada donde transformás tu imagen de forma estratégica.',
    incluye: [], que_traer: '', caratula: { motivo: 'perchero', paleta: 'durazno' }, precio: null, precio_lista: null, sena_modo: 'ninguna', sena_valor: 0, orden: 5 },
  { slug: 'gift-card', nombre: 'Gift card de experiencia', corto: 'Gift card', tipo: 'regalo', kind: 'regalo',
    lugar: 'Se envía por mail', duracion: 'Se usa cuando quiera',
    resumen: 'Regalá disfrutar una sesión de maquillaje, colorimetría e imagen personal. Un regalo pensado para quienes desean aprender, descubrir nuevos recursos y potenciar su estilo de la mano de una profesional.',
    incluye: [], que_traer: '', caratula: { motivo: 'regalo', paleta: 'ciruela' }, precio: 175000, precio_lista: 190000, sena_modo: 'ninguna', sena_valor: 0, orden: 6 },
];

const ar = (iso: string) => `${iso}-03:00`; // hora de Buenos Aires, sin horario de verano

export async function cargarCatalogo(q: Query) {
  const hay = await q<{ n: number }>(`select count(*)::int as n from cursos`);
  if (hay[0].n > 0) return;
  for (const c of CURSOS_SEED) {
    await q(
      `insert into cursos (slug, nombre, corto, tipo, kind, lugar, duracion, resumen, descripcion, incluye, que_traer, caratula,
                           precio, precio_lista, sena_modo, sena_valor, orden)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9::text[],$10,$11::text::jsonb,$12,$13,$14,$15,$16)`,
      [c.slug, c.nombre, c.corto, c.tipo, c.kind, c.lugar, c.duracion, c.resumen, c.incluye, c.que_traer, JSON.stringify(c.caratula),
       c.precio, c.precio_lista, c.sena_modo, c.sena_valor, c.orden],
    );
  }
  const id = async (slug: string) => (await q<{ id: string }>(`select id from cursos where slug=$1`, [slug]))[0].id;
  await q(
    `insert into fechas (curso_id, edicion, inicio, fin, hora, cupo, direccion) values ($1,'Edición noviembre',$2,$3,'11:00 a 13:30',4,
       (select valor #>> '{}' from ajustes where clave='direccion_estudio'))`,
    [await id('taller-automaquillaje-colorimetria'), ar('2026-11-14T11:00:00'), ar('2026-11-14T13:30:00')],
  );
  await q(
    `insert into fechas (curso_id, edicion, inicio, fin, hora, otras_clases, cupo) values ($1,'Noviembre · online',$2,$3,'19:00 a 20:30 h (Argentina)','12, 17 y 19 de noviembre',10)`,
    [await id('colorimetria-avanzada'), ar('2026-11-10T19:00:00'), ar('2026-11-19T20:30:00')],
  );
}

/* Solo para desarrollo local: turnos individuales y alumnas de ejemplo, para ver la web con vida. */
/** Usuario de prueba del panel, solo en desarrollo local. */
export const ADMIN_DEMO = { email: 'steph@demo.local', clave: 'demo-panel-2026' };

export async function cargarDemo(q: Query) {
  await q(`insert into admins (email, nombre, rol, password_hash) values ($1,'Steph (demo)','admin',$2) on conflict (email) do nothing`,
    [ADMIN_DEMO.email, hashClave(ADMIN_DEMO.clave)]);
  const slots: [string, string, string][] = [
    ['2026-11-13T15:00:00', '15:00 a 17:00', '2026-11-13T17:00:00'],
    ['2026-11-17T15:00:00', '15:00 a 17:00', '2026-11-17T17:00:00'],
    ['2026-11-20T11:00:00', '11:00 a 13:00', '2026-11-20T13:00:00'],
  ];
  for (const slug of ['sesion-automaquillaje', 'sesion-integral']) {
    const c = await q<{ id: string }>(`select id from cursos where slug=$1`, [slug]);
    for (const [ini, hora, fin] of slots) {
      await q(`insert into fechas (curso_id, edicion, inicio, fin, hora, cupo, direccion) values ($1,'Turno individual',$2,$3,$4,1,
        (select valor #>> '{}' from ajustes where clave='direccion_estudio'))`, [c[0].id, ar(ini), ar(fin), hora]);
    }
  }
  const demo = async (slug: string, n: number, estado: string, vence: boolean) => {
    const f = await q<{ id: string; curso_id: string; precio: number | null }>(
      `select f.id, f.curso_id, c.precio from fechas f join cursos c on c.id=f.curso_id where c.slug=$1 order by f.inicio limit 1`, [slug]);
    for (let i = 0; i < n; i++) {
      await q(
        `insert into reservas (codigo, curso_id, fecha_id, nombre, email, tel, estado, modo, metodo, monto_total, monto_a_pagar, monto_pagado, vence_en, notas)
         values ($1,$2,$3,$4,$5,'1100000000',$6,'total','mp',$7,$7,$8,$9,'Alumna de ejemplo (solo desarrollo)')`,
        [`DEMO-${slug.slice(0, 3).toUpperCase()}${estado[0].toUpperCase()}${i}`, f[0].curso_id, f[0].id, `Alumna de ejemplo ${i + 1}`,
         `demo+${slug.slice(0, 3)}${estado[0]}${i}@example.test`, estado, f[0].precio ?? 0, estado === 'confirmada' ? f[0].precio ?? 0 : 0,
         vence ? new Date(Date.now() + 20 * 3600_000).toISOString() : null],
      );
    }
  };
  await demo('taller-automaquillaje-colorimetria', 2, 'confirmada', false);
  await demo('colorimetria-avanzada', 4, 'confirmada', false);
  await demo('colorimetria-avanzada', 1, 'pendiente', true);
}
