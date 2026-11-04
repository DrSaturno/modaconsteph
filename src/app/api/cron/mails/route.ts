import { revalidateTag } from 'next/cache';
import { procesarCola } from '@/lib/mail/cola';
import { abrirRepeticiones } from '@/lib/repeticiones';
import { expirarVencidas } from '@/lib/reservas';

/**
 * Tarea programada (Vercel Cron la llama todos los días a las 8:00 de Buenos Aires):
 * libera lugares sin pago, abre las fechas que se repiten y envía los mails que ya les toca salir.
 */
export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET;
  // en producción solo corre con la clave (Vercel la manda sola si CRON_SECRET está cargada)
  const permitido = secreto ? req.headers.get('authorization') === `Bearer ${secreto}` : process.env.NODE_ENV !== 'production';
  if (!permitido) return new Response('no autorizado', { status: 401 });

  const liberadas = await expirarVencidas();
  const repetidas = await abrirRepeticiones();
  const mails = await procesarCola();
  revalidateTag('catalogo', 'max');
  return Response.json({ liberadas, repetidas, mails });
}
