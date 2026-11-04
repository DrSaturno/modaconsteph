import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { query } from '@/lib/db';
import { peso } from '@/lib/format';
import { simulacroActivo } from '@/lib/mp';
import { BotonSimular } from './BotonSimular';

export const metadata: Metadata = { title: 'Pago de prueba', robots: { index: false, follow: false } };

export default function Simulacro({ params }: PageProps<'/reserva/[codigo]/simulacro'>) {
  return (
    <main className="pagina">
      <div className="wrap estado"><Suspense fallback={null}><Contenido params={params} /></Suspense></div>
    </main>
  );
}

async function Contenido({ params }: { params: PageProps<'/reserva/[codigo]/simulacro'>['params'] }) {
  await connection();
  if (!simulacroActivo()) notFound();
  const { codigo } = await params;
  const r = (await query<{ monto_a_pagar: number; estado: string; codigo: string }>(
    `select monto_a_pagar, estado, codigo from reservas where codigo = $1`, [codigo.toUpperCase()]))[0];
  if (!r) notFound();
  return (
    <>
      <h1>Pago de prueba</h1>
      <p className="lead">Esto reemplaza a Mercado Pago mientras la web se prueba en esta computadora. No se cobra nada. En la web real, acá se abre el checkout de Mercado Pago.</p>
      <div className="caja"><dl><div><dt>Código</dt><dd>{r.codigo}</dd></div><div><dt>A pagar</dt><dd>{peso(r.monto_a_pagar)}</dd></div></dl></div>
      <p style={{ marginTop: 24 }}><BotonSimular codigo={r.codigo} /></p>
    </>
  );
}
