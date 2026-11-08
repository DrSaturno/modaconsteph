import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { adminActual } from '@/lib/auth';
import { query } from '@/lib/db';
import { etiquetaFecha, peso, ymdAR } from '@/lib/format';
import { Aviso, Insignia, Titulo } from '../../../componentes';
import { FECHA_VACIA, type FechaEdit } from '../CamposFecha';
import { FormCurso } from '../FormCurso';
import { FormFecha } from '../FormFecha';
import { cambiarEstadoFecha, duplicarFecha } from '../../../actions';

export const metadata = { title: 'Editar curso' };

export default function EditarCurso(props: PageProps<'/admin/cursos/[id]'>) {
  return <Suspense fallback={<p className="empty">Cargando…</p>}><Contenido {...props} /></Suspense>;
}

async function Contenido({ params, searchParams }: PageProps<'/admin/cursos/[id]'>) {
  await connection();
  const [{ id }, sp, admin] = await Promise.all([params, searchParams, adminActual()]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = (await query(`select * from cursos where id = $1`, [id]))[0];
  if (!c) notFound();
  const fechas = await query(`select * from fechas_cupo where curso_id = $1 order by inicio desc`, [id]);
  const puede = admin?.rol === 'admin';
  const aFecha = (f: Record<string, any>): FechaEdit => ({
    id: f.id, edicion: f.edicion, fecha: ymdAR(f.inicio), hora: f.hora, cupo: f.cupo, otras: f.otras_clases, fin: f.fin ? ymdAR(f.fin) : '', repite: f.repite,
    precio: f.precio, lista: f.precio_lista, hasta: f.precio_hasta ? ymdAR(f.precio_hasta) : '', link: f.link_online, direccion: f.direccion,
    estado: f.estado, publicarEn: f.publicar_en ? ymdAR(f.publicar_en) : '',
  });
  const grupal = c.kind === 'fecha' || c.kind === 'slot';
  const ahora = Date.now();
  const cupos = fechas.filter((f) => new Date(f.inicio).getTime() > ahora).map((f) => Number(f.cupo));
  const cupo = cupos.length ? Math.max(...cupos) : null;

  return (
    <>
      <Titulo titulo={c.nombre} sub="Editá el curso y gestioná sus fechas.">
        <Link className="btn sec sm" href="/admin/cursos">Volver a Cursos y fechas</Link>
        <a className="btn sec sm" href={`/cursos/${c.slug}`} target="_blank" rel="noopener">Ver en la web</a>
      </Titulo>
      <Aviso ok={typeof sp.ok === 'string' ? sp.ok : undefined} />
      {puede ? <FormCurso curso={{ id: c.id, nombre: c.nombre, tipo: c.tipo, kind: c.kind, lugar: c.lugar, duracion: c.duracion, resumen: c.resumen, descripcion: c.descripcion, para_quien: c.para_quien, incluye: c.incluye, programa: c.programa, que_traer: c.que_traer, caratula: c.caratula, orden: c.orden, cupo, precio: c.precio, precio_lista: c.precio_lista, sena_modo: c.sena_modo, sena_valor: c.sena_valor, medios: c.medios }} /> : <p className="empty">Tu usuario solo puede ver.</p>}

      {grupal && (
        <section className="card" style={{ marginTop: 28 }} id="fechas" aria-labelledby="h-fechas">
          <h2 id="h-fechas">Fechas</h2>
          {fechas.length === 0 && <p className="empty">Este curso todavía no tiene fechas.</p>}
          {fechas.map((f) => {
            const pasada = new Date(f.inicio).getTime() < ahora;
            return (
              <details key={f.id} id={`fecha-${f.id}`} style={{ borderTop: '1px solid var(--line)', padding: '12px 0' }}>
                <summary style={{ cursor: 'pointer', display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'center', minHeight: 40 }}>
                  <b>{etiquetaFecha({ inicio: new Date(f.inicio).toISOString(), otrasClases: f.otras_clases })}</b>
                  <span style={{ color: 'var(--muted)' }}>{f.hora}</span>
                  <Insignia tono={f.estado === 'abierta' ? 'good' : f.estado === 'borrador' ? 'warn' : 'neutral'}>{pasada ? 'Pasada' : f.estado === 'abierta' ? 'Publicada' : f.estado === 'borrador' ? (f.publicar_en ? 'Programada' : 'Borrador') : 'Cerrada'}</Insignia>
                  {c.kind === 'fecha' && <span>{f.libres} libres de {f.cupo}</span>}
                  {f.precio != null && <span>{peso(f.precio)}</span>}
                </summary>
                {puede && (
                  <div style={{ padding: '14px 0 4px' }}>
                    <div className="tools" style={{ marginBottom: 16 }}>
                      {f.estado !== 'abierta' && <form action={cambiarEstadoFecha}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="estado" value="abierta" /><button className="btn ok sm" type="submit">Publicar</button></form>}
                      {f.estado === 'abierta' && <form action={cambiarEstadoFecha}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="estado" value="borrador" /><button className="btn sec sm" type="submit">Pasar a borrador</button></form>}
                      {f.estado === 'abierta' && <form action={cambiarEstadoFecha}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="estado" value="cerrada" /><button className="btn bad sm" type="submit">Cerrar reservas</button></form>}
                      <form action={duplicarFecha}><input type="hidden" name="id" value={f.id} /><button className="btn sec sm" type="submit">Duplicar para el mes que viene</button></form>
                    </div>
                    <FormFecha cursoId={c.id} tipo={c.tipo} kind={c.kind} valores={aFecha(f)} />
                  </div>
                )}
              </details>
            );
          })}
          {puede && (
            <details style={{ borderTop: '1px solid var(--line)', padding: '12px 0' }} open={fechas.length === 0}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, minHeight: 40 }}>+ Agregar una fecha</summary>
              <div style={{ paddingTop: 14 }}><FormFecha cursoId={c.id} tipo={c.tipo} kind={c.kind} valores={{ ...FECHA_VACIA, cupo: c.kind === 'slot' ? 1 : (fechas[0]?.cupo ?? 4), hora: fechas[0]?.hora ?? '' }} /></div>
            </details>
          )}
        </section>
      )}
    </>
  );
}
