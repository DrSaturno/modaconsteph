import { Suspense } from 'react';
import Link from 'next/link';
import { connection } from 'next/server';
import { adminActual } from '@/lib/auth';
import { query } from '@/lib/db';
import { linkWhatsApp } from '@/lib/admin-form';
import { cuando, etiquetaFecha, peso } from '@/lib/format';
import { Insignia, Titulo } from '../../componentes';
import { avisarEspera, cancelarReserva, guardarNotaReserva, marcarPagado } from '../../actions';

export const metadata = { title: 'Reservas' };

const FILTROS = [
  ['todas', 'Todas'], ['cobrar', 'Por cobrar'], ['confirmada', 'Confirmadas'], ['espera', 'Lista de espera'], ['cerradas', 'Canceladas y vencidas'],
] as const;

export default function Reservas(props: PageProps<'/admin/reservas'>) {
  return <Suspense fallback={<p className="empty">Cargando…</p>}><Contenido {...props} /></Suspense>;
}

async function Contenido({ searchParams }: PageProps<'/admin/reservas'>) {
  await connection();
  const [sp, admin] = await Promise.all([searchParams, adminActual()]);
  const filtro = FILTROS.some(([k]) => k === sp.estado) ? String(sp.estado) : sp.estado === 'pendiente' ? 'cobrar' : 'todas';
  const donde = { todas: '', cobrar: `where r.estado = 'pendiente'`, confirmada: `where r.estado = 'confirmada'`, espera: `where r.estado = 'espera'`, cerradas: `where r.estado in ('cancelada','expirada')` }[filtro];
  const filas = await query(
    `select r.*, c.corto, c.kind, f.inicio, f.hora, f.otras_clases from reservas r join cursos c on c.id = r.curso_id left join fechas f on f.id = r.fecha_id
      ${donde} order by r.created_at desc limit 200`);
  const puede = admin?.rol === 'admin';

  return (
    <>
      <Titulo titulo="Reservas" sub="Quién reservó, qué curso, cómo pagó y si falta algo." />
      <nav className="tabs" aria-label="Filtrar reservas">
        {FILTROS.map(([k, t]) => <Link key={k} href={`/admin/reservas?estado=${k}`} aria-current={filtro === k}>{t}</Link>)}
      </nav>
      <div className="card">
        {filas.length === 0 ? <p className="empty">No hay reservas en esta vista.</p> : (
          <div className="tablewrap"><table>
            <thead><tr><th>Alumna</th><th>Curso</th><th>Pago</th><th>Cuándo reservó</th>{puede && <th>Acciones</th>}</tr></thead>
            <tbody>{filas.map((r) => {
              const resto = r.monto_total - r.monto_pagado;
              const regalo = r.regalo as { para?: string } | null;
              const msg = `Hola ${String(r.nombre).split(' ')[0]}, te escribo por tu reserva de ${r.corto}`;
              return (
                <tr key={r.id}>
                  <td><b>{r.nombre}</b><small>{r.email}</small><small>{r.tel}</small>{regalo?.para && <small>Regalo para {regalo.para}</small>}</td>
                  <td>{r.corto}{r.inicio && <small>{etiquetaFecha({ inicio: new Date(r.inicio).toISOString(), otrasClases: r.otras_clases })} · {r.hora}</small>}<small>Código {r.codigo}</small></td>
                  <td>
                    {r.estado === 'confirmada' && (resto > 0 ? <Insignia tono="warn">Dejó seña</Insignia> : <Insignia tono="good">Pagó el total</Insignia>)}
                    {r.estado === 'pendiente' && <Insignia tono="bad">Falta el pago</Insignia>}
                    {r.estado === 'espera' && <Insignia tono="neutral">Lista de espera</Insignia>}
                    {r.estado === 'cancelada' && <Insignia tono="neutral">Cancelada</Insignia>}
                    {r.estado === 'expirada' && <Insignia tono="neutral">Venció sin pago</Insignia>}
                    <small>{peso(r.monto_total)} · {r.metodo === 'mp' ? 'Mercado Pago' : r.metodo === 'transferencia' ? 'Transferencia' : 'Exterior'}</small>
                    {r.estado === 'confirmada' && resto > 0 && <small>Resta {peso(resto)}</small>}
                    {r.estado === 'pendiente' && r.vence_en && <small>Se libera {cuando(r.vence_en)}</small>}
                    {r.monto_pagado > 0 && r.estado === 'expirada' && <small>Pagó {peso(r.monto_pagado)} fuera de plazo</small>}
                  </td>
                  <td>{cuando(r.created_at)}</td>
                  {puede && <td><div className="tools">
                    {['pendiente', 'expirada'].includes(r.estado) && <form action={marcarPagado}><input type="hidden" name="id" value={r.id} /><button className="btn ok sm" type="submit">Marcar pago recibido</button></form>}
                    {r.estado === 'confirmada' && resto > 0 && <form action={marcarPagado}><input type="hidden" name="id" value={r.id} /><button className="btn ok sm" type="submit">Marcar saldo pagado</button></form>}
                    {r.estado === 'espera' && <form action={avisarEspera}><input type="hidden" name="id" value={r.id} /><button className="btn sec sm" type="submit">Avisar que hay lugar</button></form>}
                    <a className="btn sec sm" href={linkWhatsApp(r.tel, msg)} target="_blank" rel="noopener">WhatsApp</a>
                    {['pendiente', 'confirmada', 'espera'].includes(r.estado) && (
                      <details><summary className="btn bad sm" style={{ listStyle: 'none' }}>Cancelar</summary>
                        <form action={cancelarReserva} style={{ marginTop: 6 }}><input type="hidden" name="id" value={r.id} />
                          <small style={{ display: 'block', marginBottom: 6 }}>Se libera el lugar y se frenan sus avisos. El dinero, si lo pagó, se devuelve por fuera del panel.</small>
                          <button className="btn bad sm" type="submit">Sí, cancelar la reserva</button></form></details>
                    )}
                    <details><summary className="btn sec sm" style={{ listStyle: 'none' }}>{r.notas ? 'Nota ✎' : 'Nota'}</summary>
                      <form action={guardarNotaReserva} style={{ marginTop: 6, display: 'grid', gap: 6 }}><input type="hidden" name="id" value={r.id} />
                        <textarea name="notas" defaultValue={r.notas} rows={3} style={{ width: 220, border: '1.5px solid var(--line)', borderRadius: 10, padding: 8, font: 'inherit' }} />
                        <button className="btn sm" type="submit">Guardar nota</button></form></details>
                  </div></td>}
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
