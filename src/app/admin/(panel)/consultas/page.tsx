import { Suspense } from 'react';
import Link from 'next/link';
import { connection } from 'next/server';
import { adminActual } from '@/lib/auth';
import { query } from '@/lib/db';
import { linkWhatsApp } from '@/lib/admin-form';
import { cuando } from '@/lib/format';
import { Insignia, Titulo } from '../../componentes';
import { actualizarConsulta, anotarConsulta } from '../../actions';
import { Formulario } from '../Formulario';

export const metadata = { title: 'Consultas' };

const ESTADOS: Record<string, [string, 'good' | 'warn' | 'bad' | 'neutral']> = {
  nueva: ['Nueva', 'bad'], en_conversacion: ['En conversación', 'warn'], reservo: ['Reservó', 'good'], no_reservo: ['No reservó', 'neutral'],
};
const CANALES: Record<string, string> = { web: 'Web', instagram: 'Instagram', whatsapp: 'WhatsApp', otro: 'Otro' };

export default function Consultas(props: PageProps<'/admin/consultas'>) {
  return <Suspense fallback={<p className="empty">Cargando…</p>}><Contenido {...props} /></Suspense>;
}

async function Contenido({ searchParams }: PageProps<'/admin/consultas'>) {
  await connection();
  const [sp, admin] = await Promise.all([searchParams, adminActual()]);
  const filtro = typeof sp.estado === 'string' && sp.estado in ESTADOS ? sp.estado : 'todas';
  const filas = await query(
    `select q.*, c.corto from consultas q left join cursos c on c.id = q.curso_id ${filtro === 'todas' ? '' : 'where q.estado = $1'} order by q.created_at desc limit 200`,
    filtro === 'todas' ? [] : [filtro]);
  const m = (await query(`select count(*)::int as total, count(*) filter (where estado = 'reservo')::int as reservaron from consultas`))[0];
  const porCanal = await query(`select canal, count(*)::int as n, count(*) filter (where estado = 'reservo')::int as reservaron from consultas group by canal order by n desc`);
  const motivos = await query(`select motivo_no, count(*)::int as n from consultas where estado = 'no_reservo' and motivo_no <> '' group by motivo_no order by n desc limit 5`);
  const puede = admin?.rol === 'admin';

  return (
    <>
      <Titulo titulo="Consultas" sub="Quién preguntó, por qué canal, en qué estado está y cuál es el próximo paso." />
      <div className="grid3" style={{ marginBottom: 20 }}>
        <div className="card stat"><b>{m.total ? `${Math.round((m.reservaron / m.total) * 100)} %` : '–'}</b><span>de las {m.total} consultas terminaron en reserva</span></div>
        <div className="card"><h2 style={{ fontSize: 16 }}>Por qué canal llegan</h2>
          {porCanal.length ? porCanal.map((c) => <div key={c.canal} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{CANALES[c.canal]}</span><span>{c.n} · {c.reservaron} reservaron</span></div>) : <small>Todavía no hay datos.</small>}</div>
        <div className="card"><h2 style={{ fontSize: 16 }}>Qué frena a las que no compran</h2>
          {motivos.length ? motivos.map((x) => <div key={x.motivo_no} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{x.motivo_no}</span><span>{x.n}</span></div>) : <small>Cuando marques una consulta como "No reservó", anotá el motivo y aparece acá.</small>}</div>
      </div>

      {puede && (
        <details className="card" style={{ marginBottom: 20 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, minHeight: 40 }}>+ Anotar una consulta (de Instagram, WhatsApp o en persona)</summary>
          <div style={{ paddingTop: 14 }}>
            <Formulario accion={anotarConsulta} boton="Anotar consulta">
              <div className="row3">
                <div className="f"><label htmlFor="nombre">Nombre</label><input id="nombre" name="nombre" required /></div>
                <div className="f"><label htmlFor="tel">WhatsApp</label><input id="tel" name="tel" /></div>
                <div className="f"><label htmlFor="email">Email</label><input id="email" name="email" type="email" /></div>
              </div>
              <div className="row3">
                <div className="f"><label htmlFor="canal">Por dónde llegó</label><select id="canal" name="canal" defaultValue="instagram">{Object.entries(CANALES).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></div>
                <div className="f"><label htmlFor="interes">Qué le interesa</label><input id="interes" name="interes" placeholder="Ej.: Taller de noviembre" /></div>
                <div className="f"><label htmlFor="proximo_paso">Próximo paso</label><input id="proximo_paso" name="proximo_paso" placeholder="Ej.: Mandarle fechas" /></div>
              </div>
              <div className="f"><label htmlFor="mensaje">Qué dijo</label><textarea id="mensaje" name="mensaje" /></div>
            </Formulario>
          </div>
        </details>
      )}

      <nav className="tabs" aria-label="Filtrar consultas">
        <Link href="/admin/consultas" aria-current={filtro === 'todas'}>Todas</Link>
        {Object.entries(ESTADOS).map(([k, [t]]) => <Link key={k} href={`/admin/consultas?estado=${k}`} aria-current={filtro === k}>{t}</Link>)}
      </nav>
      <div className="stack">
        {filas.length === 0 && <p className="empty">No hay consultas en esta vista.</p>}
        {filas.map((q) => (
          <section className="card" key={q.id} aria-label={`Consulta de ${q.nombre}`}>
            <div className="curso-h">
              <div><h2 style={{ margin: 0, fontSize: 18 }}>{q.nombre}</h2>
                <small style={{ color: 'var(--muted)' }}>{CANALES[q.canal]} · {cuando(q.created_at)}{q.corto || q.interes ? ` · ${q.corto ?? q.interes}` : ''}</small></div>
              <div className="tools"><Insignia tono={ESTADOS[q.estado][1]}>{ESTADOS[q.estado][0]}</Insignia>
                {q.tel && <a className="btn sec sm" href={linkWhatsApp(q.tel, `Hola ${String(q.nombre).split(' ')[0]}, te escribo por tu consulta`)} target="_blank" rel="noopener">WhatsApp</a>}</div>
            </div>
            {q.mensaje && <p className="mailbox" style={{ margin: '0 0 12px' }}>{q.mensaje}</p>}
            <small style={{ color: 'var(--muted)', display: 'block', marginBottom: 10 }}>{[q.email, q.tel].filter(Boolean).join(' · ')}</small>
            {puede ? (
              <form action={actualizarConsulta} className="row3" style={{ alignItems: 'end' }}>
                <input type="hidden" name="id" value={q.id} />
                <div className="f" style={{ marginBottom: 0 }}><label htmlFor={`e-${q.id}`}>Estado</label>
                  <select id={`e-${q.id}`} name="estado" defaultValue={q.estado}>{Object.entries(ESTADOS).map(([k, [t]]) => <option key={k} value={k}>{t}</option>)}</select></div>
                <div className="f" style={{ marginBottom: 0 }}><label htmlFor={`p-${q.id}`}>Próximo paso</label><input id={`p-${q.id}`} name="proximo_paso" defaultValue={q.proximo_paso} /></div>
                <div className="f" style={{ marginBottom: 0 }}><label htmlFor={`m-${q.id}`}>Si no reservó, por qué</label><input id={`m-${q.id}`} name="motivo_no" defaultValue={q.motivo_no} placeholder="Ej.: precio, fecha, no respondió" /></div>
                <input type="hidden" name="notas" value={q.notas} />
                <button className="btn sm" type="submit">Guardar</button>
              </form>
            ) : <small>Próximo paso: {q.proximo_paso || '–'}</small>}
          </section>
        ))}
      </div>
    </>
  );
}
