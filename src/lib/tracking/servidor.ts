import 'server-only';
import crypto from 'node:crypto';
import { query } from '../db';
import { GA4_ID, META_PIXEL_ID } from './ids';

/*
 * Compras contadas desde el servidor. Es la parte que no puede hacer el navegador: la transferencia la confirma Steph a mano
 * en el panel, horas después, y Mercado Pago avisa por su cuenta. Sin esto, Meta y Analytics nunca se enterarían de una venta.
 *
 *  · Meta: API de Conversiones. Necesita META_CAPI_TOKEN (Administrador de eventos > Configuración > Generar token de acceso).
 *    META_TEST_EVENT_CODE es opcional y sirve para probar en "Probar eventos" sin ensuciar los datos reales.
 *  · Google Analytics 4: Measurement Protocol. Necesita GA4_API_SECRET (Admin > Flujos de datos > Secretos de API).
 *
 * Si falta una clave, ese envío se omite sin error. Si un envío falla, la reserva queda confirmada igual: esto nunca la frena.
 */

const GRAPH = 'https://graph.facebook.com/v23.0';
const sha = (v: string) => crypto.createHash('sha256').update(v).digest('hex');
const limpio = (v: string) => v.trim().toLowerCase();

/** Teléfono para Meta: solo dígitos y con el código de país (Argentina 54). Un celular "11 2345 6789" pasa a 541123456789. */
function telefono(t: string): string {
  let d = t.replace(/\D/g, '').replace(/^00/, '');
  if (!d) return '';
  if (d.startsWith('54')) return d;
  d = d.replace(/^0/, '').replace(/^(\d{2,4})15/, '$1'); // 011 15 xxxx → sin el 0 ni el 15 del celular
  return d.length === 10 ? '54' + d : d; // si tiene otro largo, probablemente ya trae código de país de otro lado
}

type Origen = Record<string, string | number | undefined>;
type Guardado = {
  fbp?: string; fbc?: string; gaClientId?: string; gaSessionId?: string; url?: string; ip?: string; ua?: string;
  primero?: Origen; ultimo?: Origen;
  servidor?: Record<string, unknown>;
};

type Compra = {
  id: string; codigo: string; nombre: string; email: string; tel: string;
  curso_slug: string; curso_nombre: string; curso_tipo: string; fecha_edicion: string | null;
  monto_pagado: number; tracking: Guardado | null;
};

async function postear(url: string, cuerpo: unknown): Promise<{ ok: boolean; estado: number; texto: string }> {
  const r = await fetch(url, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(4000), cache: 'no-store',
  });
  return { ok: r.ok, estado: r.status, texto: (await r.text()).slice(0, 300) };
}

async function enviarMeta(c: Compra, siteUrl: string): Promise<string> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return 'omitido: falta META_CAPI_TOKEN';
  const t = c.tracking ?? {};
  const partes = c.nombre.trim().split(/\s+/);
  const ph = telefono(c.tel);
  const datosUsuario: Record<string, unknown> = {
    em: [sha(limpio(c.email))],
    ...(ph ? { ph: [sha(ph)] } : {}),
    ...(partes[0] ? { fn: [sha(limpio(partes[0]))] } : {}),
    ...(partes.length > 1 ? { ln: [sha(limpio(partes[partes.length - 1]))] } : {}),
    external_id: [sha(limpio(c.email))],
    ...(t.fbp ? { fbp: t.fbp } : {}), ...(t.fbc ? { fbc: t.fbc } : {}),
    ...(t.ip && t.ip !== 'local' ? { client_ip_address: t.ip } : {}), ...(t.ua ? { client_user_agent: t.ua } : {}),
  };
  const cuerpo = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: `compra-${c.codigo}`,
      action_source: 'website',
      event_source_url: t.url || siteUrl,
      user_data: datosUsuario,
      custom_data: {
        currency: 'ARS', value: c.monto_pagado, order_id: c.codigo,
        content_type: 'product', content_ids: [c.curso_slug], content_name: c.curso_nombre,
        contents: [{ id: c.curso_slug, quantity: 1, item_price: c.monto_pagado }],
      },
    }],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };
  const r = await postear(`${GRAPH}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, cuerpo);
  return r.ok ? 'enviado' : `error ${r.estado}: ${r.texto}`;
}

async function enviarAnalytics(c: Compra): Promise<string> {
  const secreto = process.env.GA4_API_SECRET;
  if (!secreto) return 'omitido: falta GA4_API_SECRET';
  const t = c.tracking ?? {};
  const o = t.ultimo ?? t.primero ?? {};
  const params: Record<string, unknown> = {
    transaction_id: c.codigo, currency: 'ARS', value: c.monto_pagado,
    items: [{ item_id: c.curso_slug, item_name: c.curso_nombre, item_category: c.curso_tipo, ...(c.fecha_edicion ? { item_variant: c.fecha_edicion } : {}), price: c.monto_pagado, quantity: 1 }],
    engagement_time_msec: 1,
    ...(t.gaSessionId ? { session_id: Number(t.gaSessionId) } : {}),
    ...(o.utm_source ? { source: o.utm_source } : {}), ...(o.utm_medium ? { medium: o.utm_medium } : {}), ...(o.utm_campaign ? { campaign: o.utm_campaign } : {}),
  };
  const r = await postear(`https://www.google-analytics.com/mp/collect?measurement_id=${GA4_ID}&api_secret=${encodeURIComponent(secreto)}`, {
    client_id: t.gaClientId || `mcs.${c.codigo}`, // sin la cookie de Analytics, la compra igual se cuenta (como usuaria nueva)
    events: [{ name: 'purchase', params }],
  });
  return r.ok ? 'enviado' : `error ${r.estado}: ${r.texto}`;
}

/** Cuenta la compra de una reserva recién confirmada en Meta y Analytics. Nunca lanza error. */
export async function registrarCompra(reservaId: string): Promise<void> {
  try {
    const c = (await query<Compra>(
      `select r.id, r.codigo, r.nombre, r.email, r.tel, r.monto_pagado, to_jsonb(r) -> 'tracking' as tracking,
              c.slug as curso_slug, c.nombre as curso_nombre, c.tipo as curso_tipo, f.edicion as fecha_edicion
         from reservas r join cursos c on c.id = r.curso_id left join fechas f on f.id = r.fecha_id where r.id = $1`, [reservaId]))[0];
    if (!c || c.monto_pagado <= 0) return;
    const siteUrl = process.env.SITE_URL || 'https://modaconsteph.com.ar';
    const [meta, ga] = await Promise.allSettled([enviarMeta(c, siteUrl), enviarAnalytics(c)]);
    const texto = (x: PromiseSettledResult<string>) => (x.status === 'fulfilled' ? x.value : `error: ${String(x.reason).slice(0, 200)}`);
    const resultado = { meta: texto(meta), analytics: texto(ga), en: new Date().toISOString() };
    if ([resultado.meta, resultado.analytics].some((v) => v.startsWith('error'))) console.error('Seguimiento de compra', c.codigo, resultado);
    await query(`update reservas set tracking = coalesce(tracking, '{}'::jsonb) || jsonb_build_object('servidor', $2::text::jsonb) where id = $1`, [reservaId, JSON.stringify(resultado)]);
  } catch (e) {
    console.error('No se pudo registrar la compra en Meta/Analytics', e);
  }
}
