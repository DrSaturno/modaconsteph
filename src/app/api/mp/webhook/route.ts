import { revalidateTag } from 'next/cache';
import { query } from '@/lib/db';
import { firmaValida, obtenerPago } from '@/lib/mp';
import { confirmarPago } from '@/lib/reservas';

/** Mercado Pago avisa acá cada vez que un pago cambia. Se confirma consultando el pago a Mercado Pago, nunca por lo que diga el aviso. */
export async function POST(req: Request) {
  const url = new URL(req.url);
  let id = url.searchParams.get('data.id') ?? url.searchParams.get('id');
  let tipo = url.searchParams.get('type') ?? url.searchParams.get('topic');
  if (!id) {
    const cuerpo = (await req.json().catch(() => null)) as { type?: string; data?: { id?: string | number } } | null;
    id = cuerpo?.data?.id != null ? String(cuerpo.data.id) : null;
    tipo = tipo ?? cuerpo?.type ?? null;
  }
  if (!id || (tipo && tipo !== 'payment')) return new Response('ignorado', { status: 200 });
  if (!firmaValida(req.headers, id)) return new Response('firma inválida', { status: 401 });

  try {
    const pago = await obtenerPago(id);
    if (pago.status !== 'approved' || !pago.external_reference) return new Response('sin cambios', { status: 200 });
    const r = (await query<{ monto_a_pagar: number }>(`select monto_a_pagar from reservas where codigo = $1`, [pago.external_reference]))[0];
    if (!r) return new Response('reserva desconocida', { status: 200 });
    if (Math.abs(pago.transaction_amount - r.monto_a_pagar) > 1) {
      console.error(`Pago ${pago.id}: el monto ${pago.transaction_amount} no coincide con ${r.monto_a_pagar} de ${pago.external_reference}`);
      return new Response('monto distinto', { status: 200 });
    }
    await confirmarPago(pago.external_reference, { monto: pago.transaction_amount, mpPago: String(pago.id) });
    revalidateTag('catalogo', 'max');
    return new Response('ok', { status: 200 });
  } catch (e) {
    console.error('Aviso de Mercado Pago', e);
    return new Response('error', { status: 500 }); // Mercado Pago reintenta
  }
}
