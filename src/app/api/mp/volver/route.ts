import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { obtenerPago } from '@/lib/mp';
import { confirmarPago } from '@/lib/reservas';

/** La alumna vuelve de Mercado Pago. Si ya pagó, se confirma acá mismo sin esperar al aviso, y se la lleva a su reserva. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const codigo = (url.searchParams.get('c') ?? '').toUpperCase();
  const pagoId = url.searchParams.get('payment_id') ?? url.searchParams.get('collection_id');
  const destino = new URL(`/reserva/${encodeURIComponent(codigo)}`, req.url);
  if (codigo && pagoId && url.searchParams.get('status') === 'approved') {
    try {
      const pago = await obtenerPago(pagoId);
      const r = (await query<{ monto_a_pagar: number }>(`select monto_a_pagar from reservas where codigo = $1`, [codigo]))[0];
      if (pago.status === 'approved' && pago.external_reference === codigo && r && Math.abs(pago.transaction_amount - r.monto_a_pagar) <= 1) {
        await confirmarPago(codigo, { monto: pago.transaction_amount, mpPago: String(pago.id) });
        revalidateTag('catalogo', 'max');
      }
    } catch (e) {
      console.error('Vuelta de Mercado Pago', e); // el aviso (webhook) lo confirma igual
    }
  }
  return NextResponse.redirect(destino);
}
