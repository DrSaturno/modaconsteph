import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { query } from '@/lib/db';
import { leerAjustes } from '@/lib/ajustes';
import { etiquetaFecha, momento, peso } from '@/lib/format';

export const metadata: Metadata = { title: 'Tu reserva', robots: { index: false, follow: false } };

export default function PaginaReserva({ params }: PageProps<'/reserva/[codigo]'>) {
  return (
    <main className="pagina">
      <div className="wrap estado">
        <Suspense fallback={<p className="lead">Buscando tu reserva…</p>}><Estado params={params} /></Suspense>
      </div>
    </main>
  );
}

const enmascarar = (m: string) => m.replace(/^(.).*(@.*)$/, '$1•••$2');

async function Estado({ params }: { params: PageProps<'/reserva/[codigo]'>['params'] }) {
  await connection();
  const { codigo } = await params;
  const r = (await query(
    `select r.*, c.nombre as curso, c.corto, c.lugar, c.tipo, c.kind, c.que_traer, c.slug, f.inicio, f.hora, f.otras_clases, f.link_online
       from reservas r join cursos c on c.id = r.curso_id left join fechas f on f.id = r.fecha_id where r.codigo = $1`, [codigo.toUpperCase()]))[0];
  if (!r) notFound();
  const a = await leerAjustes();
  const wa = a.whatsapp ? `https://wa.me/${a.whatsapp}?text=${encodeURIComponent(`Hola Steph, soy ${r.nombre}. Te escribo por mi reserva ${r.codigo}.`)}` : '';
  const fecha = r.inicio ? etiquetaFecha({ inicio: new Date(r.inicio).toISOString(), otrasClases: r.otras_clases ?? '' }) : '';
  const resto = r.monto_total - r.monto_pagado;
  const t = a.transferencia;
  const titulo =
    r.estado === 'confirmada' ? (r.kind === 'regalo' ? '¡Regalo listo!' : '¡Lugar reservado!')
    : r.estado === 'espera' ? 'Estás en la lista de espera'
    : r.estado === 'pendiente' ? (r.metodo === 'mp' ? 'Estamos esperando tu pago' : 'Falta tu pago para confirmar')
    : 'Esta reserva ya no está activa';

  return (
    <>
      <h1>{titulo}</h1>
      <p className="lead">
        {r.estado === 'confirmada' && <>Te mandamos la confirmación a {enmascarar(r.email)}. Guardá este código: <b>{r.codigo}</b>.</>}
        {r.estado === 'espera' && <>Si se libera un lugar o se abre otra fecha, te escribimos a {enmascarar(r.email)}.</>}
        {r.estado === 'pendiente' && r.metodo === 'mp' && <>Si ya pagaste, la confirmación llega en unos segundos. Actualizá esta página para verla.</>}
        {r.estado === 'pendiente' && r.metodo !== 'mp' && r.vence_en && <>Tu lugar queda reservado hasta el {momento(new Date(r.vence_en).toISOString())}.</>}
        {['expirada', 'cancelada'].includes(r.estado) && <>El plazo venció o la reserva se canceló. Si todavía querés cursar, podés reservar de nuevo.</>}
      </p>

      <div className="caja">
        <dl>
          <div><dt>Propuesta</dt><dd>{r.curso}</dd></div>
          {fecha && <div><dt>Fecha</dt><dd>{fecha}</dd></div>}
          {r.hora && <div><dt>Horario</dt><dd>{r.hora}</dd></div>}
          <div><dt>Dónde</dt><dd>{r.lugar}</dd></div>
          {r.que_traer && <div><dt>Qué traer</dt><dd>{r.que_traer}</dd></div>}
          <div><dt>Total</dt><dd>{peso(r.monto_total)}</dd></div>
          {r.monto_pagado > 0 && <div><dt>Pagado</dt><dd>{peso(r.monto_pagado)}</dd></div>}
          {r.estado === 'confirmada' && resto > 0 && <div><dt>Resta abonar antes de la clase</dt><dd>{peso(resto)}</dd></div>}
          {r.kind === 'regalo' && <div><dt>Código de la gift card</dt><dd>{r.codigo}</dd></div>}
        </dl>
      </div>

      {r.estado === 'pendiente' && r.metodo === 'transferencia' && (
        <div className="caja">
          <b>Transferí {peso(r.monto_a_pagar)} a:</b>
          <pre>{[t.titular && `Titular: ${t.titular}`, t.cuit && `CUIT/CUIL: ${t.cuit}`, t.banco && `Banco: ${t.banco}`, t.cbu && `CBU: ${t.cbu}`, t.alias && `Alias: ${t.alias}`].filter(Boolean).join('\n') || 'Steph te pasa los datos por WhatsApp.'}</pre>
          <p>Después mandanos el comprobante por mail (respondiendo la confirmación) o por WhatsApp. Cuando lo veamos, te llega la confirmación.</p>
        </div>
      )}
      {r.estado === 'pendiente' && r.metodo === 'exterior' && (
        <div className="caja">
          <b>Pago desde el exterior: {peso(r.monto_a_pagar)}</b>
          <p>{a.exterior.instrucciones || 'Steph te escribe con las instrucciones para pagar desde tu país.'}</p>
          {a.exterior.link && <p><a href={a.exterior.link} target="_blank" rel="noopener">{a.exterior.link}</a></p>}
        </div>
      )}
      {r.estado === 'confirmada' && r.kind !== 'regalo' && (
        <div className="caja"><b>Lo que pasa desde ahora</b>
          <p>Te mandamos un recordatorio 48 horas antes y, el mismo día de la clase, {r.tipo === 'online' ? 'el link para conectarte' : 'la dirección exacta'}. Después de la clase te escribimos para saber cómo te fue.</p></div>
      )}

      <p style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {wa && <a className="btn dark" href={wa} target="_blank" rel="noopener">Escribirle a Steph</a>}
        <Link className="btn" style={{ background: 'var(--paper)', boxShadow: 'inset 0 0 0 1.5px var(--plum)' }} href="/">Volver al inicio</Link>
      </p>
    </>
  );
}
