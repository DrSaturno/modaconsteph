'use server';

import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import { query } from '@/lib/db';
import { esEmail } from '@/lib/format';
import { permitir } from '@/lib/limites';
import { crearReserva, confirmarPago } from '@/lib/reservas';
import { simulacroActivo } from '@/lib/mp';
import type { ResultadoReserva } from '@/lib/tipos';

async function ipDelVisitante(): Promise<string> {
  const h = await headers();
  return (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'local';
}

export async function reservar(entrada: unknown): Promise<ResultadoReserva> {
  const r = await crearReserva(entrada, await ipDelVisitante(), (await headers()).get('user-agent') ?? '');
  updateTag('catalogo');
  return r;
}

export async function suscribir(email: string, origen: string, trampa?: string): Promise<{ ok: boolean; mensaje: string }> {
  if (trampa) return { ok: true, mensaje: 'Listo.' }; // campo oculto: solo lo completan los robots
  const mail = email.trim().toLowerCase();
  if (!esEmail(mail)) return { ok: false, mensaje: 'Revisá el email: tiene que ser como nombre@correo.com.' };
  if (!(await permitir(`news:${await ipDelVisitante()}`, 8, 3600))) return { ok: false, mensaje: 'Probá de nuevo en un rato.' };
  const origenOk = ['web', 'espera', 'pie'].includes(origen) ? origen : 'web';
  await query(
    `insert into suscriptores (email, origen) values ($1, $2) on conflict (lower(email)) do update set baja_en = null`, [mail, origenOk]);
  return { ok: true, mensaje: mail };
}

/** Solo en desarrollo: marca la reserva como pagada, como lo haría Mercado Pago. */
export async function simularPago(codigo: string): Promise<{ ok: boolean }> {
  if (!simulacroActivo()) return { ok: false };
  const r = (await query<{ monto_a_pagar: number }>(`select monto_a_pagar from reservas where codigo = $1`, [codigo]))[0];
  if (!r) return { ok: false };
  await confirmarPago(codigo, { monto: r.monto_a_pagar, mpPago: 'SIMULADO' });
  updateTag('catalogo');
  return { ok: true };
}
