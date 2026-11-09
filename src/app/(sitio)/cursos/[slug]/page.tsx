import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAjustesPublicos, getCurso, getSlugs } from '@/lib/catalogo';
import { huellaCaratula, propsCaratula } from '@/lib/caratula';
import { cuposTexto, etiquetaFecha, peso } from '@/lib/format';
import { Caratula } from '@/components/Caratula';
import { Boletin } from '@/components/sitio/Boletin';
import { VerCurso } from '@/components/sitio/Rastreo';
import { Lugares, ReservarBtn } from '@/components/sitio/Reservas';

// Los cursos conocidos salen prearmados (generateStaticParams); uno que no existe tiene que dar 404 de verdad,
// así que acá se prefiere una respuesta correcta antes que una navegación "instantánea" con la página vacía.
export const instant = false;

export async function generateStaticParams() {
  return (await getSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<'/cursos/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCurso(slug);
  if (!c) return {};
  // la imagen que se ve al compartir el link es la carátula del curso (ver ./compartir)
  const imagen = { url: `/cursos/${slug}/compartir?v=${huellaCaratula(propsCaratula(c))}`, width: 1200, height: 630, alt: c.nombre };
  return {
    title: c.nombre, description: c.resumen,
    openGraph: { title: c.nombre, description: c.resumen, images: [imagen] },
    twitter: { card: 'summary_large_image', title: c.nombre, description: c.resumen, images: [imagen.url] },
  };
}

export default async function FichaCurso({ params }: PageProps<'/cursos/[slug]'>) {
  const { slug } = await params;
  const [c, aj] = await Promise.all([getCurso(slug), getAjustesPublicos()]);
  if (!c) notFound(); // se decide antes de enviar nada, así Google recibe un 404 de verdad
  const rotulo = { presencial: 'Presencial', online: 'Online', '1a1': '1 a 1', regalo: 'Regalo' }[c.tipo];
  const grupal = c.kind === 'fecha';
  return (
    <main>
      <VerCurso slug={c.slug} nombre={c.nombre} tipo={c.tipo} precio={c.fechas[0]?.precio ?? c.precio} />
      <section className="hero mini">
        <div className="wrap hero-ficha">
          <div>
            <p className="crumb"><Link href="/#cursos">Cursos y sesiones</Link> / {c.corto}</p>
            <span className="tag">{rotulo}</span>
            <h1>{c.nombre}</h1>
            <p className="lead">{c.resumen}</p>
          </div>
          <Caratula {...propsCaratula(c)} className="cv-ficha" />
        </div>
      </section>
      <section className="pagina">
        <div className="wrap ficha">
          <div>
            <h2>De qué se trata</h2>
            <p>{c.descripcion || c.resumen}</p>
            {c.paraQuien && <><h2>Para quién es</h2><p>{c.paraQuien}</p></>}
            {c.incluye.length > 0 && <><h2>Qué incluye</h2><ul>{c.incluye.map((i) => <li key={i}>{i}</li>)}</ul></>}
            {c.programa.length > 0 && <><h2>Programa</h2><ul>{c.programa.map((i) => <li key={i}>{i}</li>)}</ul></>}
            <h2>Cómo es</h2>
            <ul><li>Duración: {c.duracion}</li><li>Dónde: {c.lugar}</li>{c.queTraer && <li>Qué traer: {c.queTraer}</li>}</ul>
            {aj.politicaCambios && <><h2>Cambios y cancelaciones</h2><p>{aj.politicaCambios}</p></>}
          </div>
          <aside className="ficha-lado" aria-label="Reservar">
            <div className="lado-card">
              <h3>{c.kind === 'consulta' ? 'Empezá con una entrevista' : c.kind === 'regalo' ? 'Regalá esta experiencia' : 'Reservá tu lugar'}</h3>
              {c.precio && <p><span style={{ fontSize: 13, color: 'var(--suave)' }}>{c.precioLista && <s>{peso(c.precioLista)} </s>}</span><b style={{ fontFamily: 'var(--f-head)', fontSize: 30 }}>{peso(c.fechas[0]?.precio ?? c.precio)}</b></p>}
              {grupal || c.kind === 'slot' ? (
                c.fechas.length ? (
                  <>
                    {c.fechas.map((f) => (
                      <div className="lado-fecha" key={f.id}>
                        <b>{etiquetaFecha(f)}</b>
                        <small>{f.hora}</small>
                        {c.kind === 'fecha' && <><Lugares total={f.cupo} libres={f.libres} /><small>{cuposTexto(f.libres, f.cupo)}</small></>}
                        <ReservarBtn slug={c.slug} fechaId={f.id} className="btn dark sm">{f.libres > 0 ? 'Reservar' : 'Lista de espera'}</ReservarBtn>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <p style={{ color: 'var(--suave)', fontSize: 15 }}>Por ahora no hay fechas abiertas. Dejá tu mail y te avisamos apenas se abra la próxima.</p>
                    <Boletin origen="espera" ok="Listo, te avisamos cuando abra la próxima fecha." boton="Avisarme" />
                  </>
                )
              ) : (
                <ReservarBtn slug={c.slug} className="btn dark">{c.kind === 'consulta' ? 'Pedir entrevista' : 'Regalar una experiencia'}</ReservarBtn>
              )}
            </div>
            {aj.whatsapp && <a className="btn ghost" href={`https://wa.me/${aj.whatsapp}`} target="_blank" rel="noopener">¿Dudas? Escribime por WhatsApp</a>}
          </aside>
        </div>
      </section>
    </main>
  );
}
