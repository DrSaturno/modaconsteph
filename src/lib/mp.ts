import 'server-only';
import crypto from 'node:crypto';
import { siteUrl } from './ajustes';

/* Mercado Pago (Checkout Pro). Sin librería: solo dos llamadas a su API. */

export const mpConfigurado = () => !!process.env.MP_ACCESS_TOKEN;
/** Pago de mentira para probar el recorrido completo en desarrollo. Hay que pedirlo explícitamente en .env.local. */
export const simulacroActivo = () => !mpConfigurado() && process.env.MCS_SIMULAR_PAGOS === '1' && !process.env.VERCEL;

const API = 'https://api.mercadopago.com';
const auth = () => ({ Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' });

export async function crearPreferencia(p: {
  codigo: string; titulo: string; monto: number; nombre: string; email: string; venceMin: number;
}): Promise<{ id: string; url: string }> {
  const base = siteUrl();
  const volver = `${base}/api/mp/volver?c=${encodeURIComponent(p.codigo)}`;
  const hasta = new Date(Date.now() + p.venceMin * 60_000);
  const body: Record<string, unknown> = {
    items: [{ id: p.codigo, title: p.titulo, quantity: 1, unit_price: p.monto, currency_id: 'ARS' }],
    payer: { name: p.nombre, email: p.email },
    external_reference: p.codigo,
    back_urls: { success: volver, failure: volver, pending: volver },
    statement_descriptor: 'MODACONSTEPH',
    expires: true,
    expiration_date_from: new Date().toISOString(),
    expiration_date_to: hasta.toISOString(),
  };
  if (base.startsWith('https://')) {
    body.auto_return = 'approved';
    body.notification_url = `${base}/api/mp/webhook`;
  }
  const r = await fetch(`${API}/checkout/preferences`, { method: 'POST', headers: auth(), body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`Mercado Pago ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = (await r.json()) as { id: string; init_point: string };
  return { id: j.id, url: j.init_point };
}

export type PagoMP = { id: number; status: string; transaction_amount: number; external_reference: string | null };

export async function obtenerPago(id: string | number): Promise<PagoMP> {
  const r = await fetch(`${API}/v1/payments/${encodeURIComponent(String(id))}`, { headers: auth(), cache: 'no-store' });
  if (!r.ok) throw new Error(`Mercado Pago ${r.status} al consultar el pago ${id}`);
  return (await r.json()) as PagoMP;
}

/** Valida la firma del aviso (x-signature). Si no hay MP_WEBHOOK_SECRET configurado, no se puede validar y devuelve true:
 *  igual el pago se confirma consultándolo a Mercado Pago con nuestro token, que es la fuente de verdad. */
export function firmaValida(headers: Headers, dataId: string): boolean {
  const secreto = process.env.MP_WEBHOOK_SECRET;
  if (!secreto) return true;
  const firma = headers.get('x-signature') ?? '';
  const ts = /ts=([^,]+)/.exec(firma)?.[1];
  const v1 = /v1=([^,]+)/.exec(firma)?.[1];
  if (!ts || !v1) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifiesto = `id:${id};request-id:${headers.get('x-request-id') ?? ''};ts:${ts};`;
  const esperado = crypto.createHmac('sha256', secreto).update(manifiesto).digest('hex');
  const a = Buffer.from(esperado), b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
