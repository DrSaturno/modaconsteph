import { Suspense } from 'react';
import Link from 'next/link';
import { connection } from 'next/server';
import { adminActual } from '@/lib/auth';
import { query } from '@/lib/db';
import { cuando, etiquetaFecha, peso } from '@/lib/format';
import { Aviso, Insignia, Titulo } from '../componentes';

export const metadata = { title: 'Resumen de hoy' };

export default function Resumen(props: PageProps<'/admin'>) {
  return <Suspense fallback={<p className="empty">Cargando…</p>}><Contenido {...props} /></Suspense>;
}

async function Contenido({ searchParams }: PageProps<'/admin'>) {
  await connection();
  const [admin, sp] = await Promise.all([adminActual(), searchParams]);
  const ok = typeof sp.sin_permiso === 'string' ? 'sin_permiso' : undefined;

  const [pend, nuevas, borradores, sinFechas, conError, proximas, mes] = await Promise.all([
    query(`select r.nombre, r.monto_a_pagar, r.vence_en, c.corto from reservas r join cursos c on c.id = r.curso_id
           where r.estado = 'pendiente' and r.metodo <> 'mp' order by r.vence_en limit 5`),
    query<{ n: number }>(`select count(*)::int as n from consultas where estado = 'nueva'`),
    query<{ n: number }>(`select count(*)::int as n from fechas where estado = 'borrador'`),
    query(`select c.id, c.nombre from cursos c where c.activo and c.kind = 'fecha'
             and not exists (select 1 from fechas f where f.curso_id = c.id and f.estado = 'abierta' and f.inicio > now())`),
    query<{ n: number }>(`select count(*)::int as n from mails where estado = 'error'`),
    query(`select f.id, f.inicio, f.hora, f.otras_clases, f.cupo, f.libres, c.nombre, c.id as curso_id from fechas_cupo f join cursos c on c.id = f.curso_id
           where f.estado = 'abierta' and f.inicio > now() order by f.inicio limit 4`),
    query(`select (select count(*)::int from reservas where estado = 'confirmada' and created_at > now() - interval '30 days') as reservas,
                  (select coalesce(sum(monto_pagado), 0)::int from reservas where estado = 'confirmada' and created_at > now() - interval '30 days') as cobrado,
                  (select count(*)::int from consultas where created_at > now() - interval '30 days') as consultas,
                  (select count(*)::int from consultas where created_at > now() - interval '30 days' and estado = 'reservo') as convertidas`),
  ]);
  const quienes = proximas.length
    ? await query(`select r.fecha_id, r.nombre, r.estado, r.monto_total, r.monto_pagado from reservas r
                   where r.fecha_id = any($1::uuid[]) and r.estado in ('confirmada','pendiente') order by r.created_at`, [proximas.map((p) => p.id)])
    : [];
  const m = mes[0];

  const tareas: { t: string; d: string; href: string }[] = [];
  if (nuevas[0].n) tareas.push({ t: `Responder ${nuevas[0].n} consulta${nuevas[0].n > 1 ? 's' : ''} nueva${nuevas[0].n > 1 ? 's' : ''}`, d: 'Entraron por la web, Instagram o WhatsApp', href: '/admin/consultas' });
  for (const p of pend) tareas.push({ t: `Confirmar el pago de ${p.nombre}`, d: `${p.corto} · ${peso(p.monto_a_pagar)} · su lugar se libera ${p.vence_en ? cuando(p.vence_en) : 'pronto'}`, href: '/admin/reservas?estado=pendiente' });
  for (const c of sinFechas) tareas.push({ t: `Abrir nuevas fechas de ${c.nombre}`, d: 'No quedan fechas abiertas. Duplicá la última y cambiá el día', href: `/admin/cursos/${c.id}` });
  if (borradores[0].n) tareas.push({ t: `Revisar ${borradores[0].n} fecha${borradores[0].n > 1 ? 's' : ''} en borrador`, d: 'Todavía no se ven en la web', href: '/admin/cursos' });
  if (conError[0].n) tareas.push({ t: `${conError[0].n} mail${conError[0].n > 1 ? 's' : ''} no se pudo enviar`, d: 'Revisalos y reenviá', href: '/admin/mails' });

  return (
    <>
      <Titulo titulo={`Hola${admin?.nombre ? `, ${admin.nombre.split(' ')[0]}` : ''}`} sub="Esto es lo que pasa hoy en tu web." />
      <Aviso ok={ok} />
      <div className="grid3" style={{ marginBottom: 20 }}>
        <div className="card stat"><b>{m.reservas}</b><span>reservas confirmadas en 30 días</span></div>
        <div className="card stat"><b>{peso(m.cobrado)}</b><span>cobrado en 30 días</span></div>
        <div className="card stat"><b>{m.consultas ? `${Math.round((m.convertidas / m.consultas) * 100)} %` : '–'}</b><span>de {m.consultas} consultas terminaron en reserva</span></div>
      </div>
      <div className="grid2">
        <section className="card" aria-labelledby="h-tareas">
          <h2 id="h-tareas">Tu lista de hoy</h2>
          {tareas.length ? (
            <ul className="todo">{tareas.map((t) => <li key={t.t}><div><b><Link href={t.href}>{t.t}</Link></b><small>{t.d}</small></div></li>)}</ul>
          ) : <p className="empty">No hay nada pendiente. Todo al día.</p>}
        </section>
        <section className="card" aria-labelledby="h-prox">
          <h2 id="h-prox">Próximas clases</h2>
          {proximas.length ? proximas.map((p) => {
            const gente = quienes.filter((q) => q.fecha_id === p.id);
            return (
              <div key={p.id} style={{ marginBottom: 16 }}>
                <div className="curso-h"><b><Link href={`/admin/cursos/${p.curso_id}`}>{p.nombre}</Link></b>
                  <Insignia tono={p.libres === 0 ? 'bad' : p.libres <= 2 ? 'warn' : 'good'}>{p.libres === 0 ? 'Completo' : `${p.libres} libres de ${p.cupo}`}</Insignia></div>
                <small style={{ color: 'var(--muted)' }}>{etiquetaFecha({ inicio: new Date(p.inicio).toISOString(), otrasClases: p.otras_clases })} · {p.hora}</small>
                <div style={{ marginTop: 6, fontSize: 14 }}>
                  {gente.length ? gente.map((g) => <div key={g.nombre + g.estado}>{g.nombre} {g.estado === 'pendiente' ? <Insignia tono="bad">falta pago</Insignia> : g.monto_pagado < g.monto_total ? <Insignia tono="warn">dejó seña</Insignia> : <Insignia tono="good">pagó</Insignia>}</div>) : <span style={{ color: 'var(--muted)' }}>Todavía no hay reservas.</span>}
                </div>
              </div>
            );
          }) : <p className="empty">No hay clases abiertas. <Link href="/admin/cursos/nuevo">Cargá una</Link>.</p>}
        </section>
      </div>
    </>
  );
}
