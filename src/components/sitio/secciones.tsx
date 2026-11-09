import Image from 'next/image';
import Link from 'next/link';
import { propsCaratula } from '@/lib/caratula';
import { cuposTexto, etiquetaFecha, partes, peso } from '@/lib/format';
import { PASOS, RESENAS, preguntas } from '@/lib/contenido';
import type { AjustesPublicos, Curso, Fecha } from '@/lib/tipos';
import { Caratula } from '../Caratula';
import { Boletin } from './Boletin';
import { FiltroCursos } from './FiltroCursos';
import { Lugares, ReservarBtn } from './Reservas';

export type ConFecha = { curso: Curso; fecha: Fecha };

/** Todas las fechas abiertas de cursos grupales, de la más próxima a la más lejana. */
export function fechasGrupales(catalogo: Curso[]): ConFecha[] {
  return catalogo
    .filter((c) => c.kind === 'fecha')
    .flatMap((curso) => curso.fechas.map((fecha) => ({ curso, fecha })))
    .sort((a, b) => a.fecha.inicio.localeCompare(b.fecha.inicio));
}

/* ---------- Cabecera, pie y barra del celular ---------- */

export function Cabecera() {
  const links = [['#fechas', 'Fechas'], ['#cursos', 'Cursos'], ['#regalo', 'Regalá'], ['#steph', 'Sobre Steph'], ['#faq', 'Preguntas']];
  return (
    <header className="top">
      <div className="wrap top-in">
        <Link className="logo" href="/" aria-label="Moda con Steph, inicio"><Image src="/img/logo-rosa.png" alt="Moda con Steph" width={84} height={60} style={{ height: 60, width: 'auto' }} priority /></Link>
        <nav aria-label="Principal">{links.map(([h, t]) => <Link key={h} href={`/${h}`}>{t}</Link>)}</nav>
        <div className="top-r">
          <Link className="btn sm" href="/#fechas">Reservar</Link>
          <details className="menu"><summary aria-label="Abrir menú">Menú</summary>
            <div>{links.map(([h, t]) => <Link key={h} href={`/${h}`}>{t}</Link>)}</div></details>
        </div>
      </div>
    </header>
  );
}

export function Pie({ aj }: { aj: AjustesPublicos }) {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-in">
          <div>
            <Image src="/img/logo-claro.png" alt="Moda con Steph" width={101} height={72} style={{ height: 72, width: 'auto' }} />
            <p>Estudio de maquillaje e imagen personal.<br />Belgrano, CABA, a pasos de Av. Cabildo, con subte y colectivos.</p>
          </div>
          <div>
            <h4>Seguime</h4>
            {aj.instagram && <a href={`https://instagram.com/${aj.instagram.replace('@', '')}`} target="_blank" rel="noopener">Instagram</a>}
            {aj.linkResena && <a href={aj.linkResena} target="_blank" rel="noopener">Reseñas en Google</a>}
          </div>
          <div>
            <h4>Escribime</h4>
            {aj.whatsapp && <a href={`https://wa.me/${aj.whatsapp}`} target="_blank" rel="noopener">WhatsApp {aj.whatsapp.replace(/^549(\d{2})(\d{4})(\d{4})$/, '$1 $2-$3')}</a>}
            <Link href="/#faq">Preguntas frecuentes</Link>
          </div>
        </div>
        <p className="copy">
          <span>© 2026 Moda con Steph. Todos los derechos reservados.</span>
          <span className="copy-links"><Link href="/privacidad">Política de privacidad</Link><Link href="/cookies">Política de cookies</Link></span>
        </p>
      </div>
    </footer>
  );
}

export function BarraCelular({ catalogo, aj }: { catalogo: Curso[]; aj: AjustesPublicos }) {
  const prox = fechasGrupales(catalogo)[0];
  const p = prox && partes(prox.fecha.inicio);
  return (
    <div className="sticky">
      {prox
        ? <ReservarBtn slug={prox.curso.slug} fechaId={prox.fecha.id}>Reservar · {p!.diaCorto} {p!.num} {p!.mesCorto}</ReservarBtn>
        : <Link className="btn" href="/#fechas">Ver fechas</Link>}
      {aj.whatsapp && <a className="wa" href={`https://wa.me/${aj.whatsapp}`} target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">WA</a>}
    </div>
  );
}

/* ---------- Portada ---------- */

function Bombitas() {
  // arriba y derecha de izquierda a derecha, abajo y a la izquierda al revés: se encienden dando la vuelta al espejo
  const fila = (cls: string, n: number, desde: number, invertir: boolean) => (
    <div className={`row ${cls}`}>
      {Array.from({ length: n }, (_, i) => <span key={i} className="bulb" style={{ '--i': desde + (invertir ? n - 1 - i : i) } as React.CSSProperties} />)}
    </div>
  );
  return <div className="bulbs" aria-hidden="true">{fila('t', 7, 0, false)}{fila('r', 6, 7, false)}{fila('b', 7, 13, true)}{fila('l', 6, 20, true)}</div>;
}

export function Portada({ catalogo }: { catalogo: Curso[] }) {
  const todas = fechasGrupales(catalogo);
  const prox = todas[0];
  const otra = prox && todas.find((x) => x.curso.id !== prox.curso.id);
  const p = prox && partes(prox.fecha.inicio);
  return (
    <section className="hero" id="inicio">
      <div className="wrap hero-in">
        <div className="hero-txt">
          <p className="eyebrow">Estudio de maquillaje e imagen · Belgrano</p>
          <h1>Aprendé a maquillarte entendiendo qué funciona <em>para vos.</em></h1>
          <p className="lead">Talleres y cursos de maquillaje y colorimetría en grupos de hasta 4 alumnas. En el estudio de Steph o en vivo por Zoom.</p>
          <div className="cta-row">
            {prox ? <ReservarBtn slug={prox.curso.slug} fechaId={prox.fecha.id}>Reservar mi lugar</ReservarBtn> : <Link className="btn" href="#cursos">Ver propuestas</Link>}
            <a className="btn ghost" href="#fechas">Ver todas las fechas</a>
          </div>
          <ul className="proof"><li><b>+110</b> reseñas en Google</li><li><b>Hasta 4</b> alumnas por grupo</li><li><b>Presencial</b> y online</li></ul>
        </div>
        <div className="mirror">
          <Bombitas />
          <div className="glass">
            {prox ? (
              <>
                <p className="g-label">Tu próximo turno</p>
                <div className="g-date"><span className="g-num">{p!.num}</span><span className="g-m"><b>{p!.diaLargo}</b>{p!.mesLargo} · {prox.fecha.hora}</span></div>
                <h2 className="g-title">{prox.curso.nombre}</h2>
                <p className="g-meta">{prox.curso.lugar} · grupo de hasta {prox.fecha.cupo} alumnas</p>
                <div className="g-seats"><Lugares total={prox.fecha.cupo} libres={prox.fecha.libres} /><span>{cuposTexto(prox.fecha.libres, prox.fecha.cupo)}</span></div>
                <div className="g-price">{prox.fecha.precioLista && <s>{peso(prox.fecha.precioLista)}</s>}<b>{peso(prox.fecha.precio)}</b></div>
                <ReservarBtn slug={prox.curso.slug} fechaId={prox.fecha.id} className="btn dark">{prox.fecha.libres > 0 ? 'Reservar mi lugar' : 'Anotarme en la lista de espera'}</ReservarBtn>
                {otra && <p className="g-also">También en {partes(otra.fecha.inicio).mesLargo}: <ReservarBtn slug={otra.curso.slug} fechaId={otra.fecha.id} className="link">{otra.curso.nombre}{otra.curso.tipo === 'online' ? ', online' : ''}</ReservarBtn></p>}
              </>
            ) : (
              <>
                <p className="g-label">Próximas fechas</p>
                <h2 className="g-title" style={{ marginTop: 14 }}>Estamos armando el calendario</h2>
                <p className="g-meta" style={{ marginBottom: 18 }}>Dejá tu mail y te avisamos apenas se abra la próxima fecha.</p>
                <Boletin origen="espera" ok="Listo, te avisamos cuando abra la próxima fecha." boton="Avisarme" />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Agenda ---------- */

export function Agenda({ catalogo }: { catalogo: Curso[] }) {
  const filas = fechasGrupales(catalogo);
  return (
    <section className="sec" id="fechas">
      <div className="wrap">
        <p className="eyebrow">Agenda</p>
        <h2 style={{ marginTop: 10 }}>Próximas fechas</h2>
        <p className="sec-sub">Cada lugar es una luz: las que siguen encendidas están disponibles. Los lugares se actualizan solos con cada reserva.</p>
        <div className="sheet">
          {filas.map(({ curso, fecha }) => {
            const p = partes(fecha.inicio);
            return (
              <article className="sheet-row" key={fecha.id}>
                <div className="sd"><b>{p.num}</b><span>{p.diaCorto} · {p.mesCorto}</span></div>
                <div><h3 className="sr-t"><Link href={`/cursos/${curso.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{curso.nombre}</Link></h3>
                  <p className="sr-m">{etiquetaFecha(fecha)} · {fecha.hora} · {curso.lugar}</p></div>
                <div className="sr-s"><Lugares total={fecha.cupo} libres={fecha.libres} /><span>{cuposTexto(fecha.libres, fecha.cupo)}</span></div>
                <div className="sr-p">{fecha.precioLista && <s>{peso(fecha.precioLista)}</s>}<b>{peso(fecha.precio)}</b></div>
                <ReservarBtn slug={curso.slug} fechaId={fecha.id}>{fecha.libres > 0 ? 'Reservar' : 'Lista de espera'}</ReservarBtn>
              </article>
            );
          })}
          <div className="sheet-wait">
            <p><b>{filas.length ? '¿Ninguna fecha te sirve?' : 'Todavía no hay fechas abiertas.'}</b> Dejá tu mail y te avisamos apenas se abra la próxima.</p>
            <Boletin origen="espera" ok="Listo, te avisamos cuando abra la próxima fecha." boton="Avisarme" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Cursos ---------- */

const ROTULO = { presencial: 'Presencial', online: 'Online', '1a1': '1 a 1', regalo: 'Regalo' } as const;

export function TarjetaCurso({ c }: { c: Curso }) {
  const prox = c.fechas[0];
  const precio = prox ? prox.precio : c.precio;
  const lista = prox ? prox.precioLista : c.precioLista;
  const hayLugar = c.kind === 'consulta' || c.fechas.length > 0;
  return (
    <article className="card" data-tipo={c.tipo}>
      <Link className="card-img" href={`/cursos/${c.slug}`} tabIndex={-1} aria-hidden="true"><Caratula {...propsCaratula(c)} /></Link>
      <div className="card-b">
        <span className="tag">{ROTULO[c.tipo]}</span>
        <h3><Link href={`/cursos/${c.slug}`}>{c.nombre}</Link></h3>
        <p>{c.resumen}</p>
        <div className="card-meta"><span>{c.duracion}</span><span>{c.lugar}</span></div>
        {c.incluye.length > 0 && <details><summary>Qué incluye</summary><ul>{c.incluye.map((i) => <li key={i}>{i}</li>)}</ul></details>}
        <div className="card-f">
          <div className="card-pr">{precio ? <>{lista && <s>{peso(lista)}</s>}<b>{peso(precio)}</b></> : <b style={{ fontSize: 17 }}>A consultar</b>}</div>
          {hayLugar
            ? <ReservarBtn slug={c.slug} fechaId={prox?.id} className="btn dark sm">{c.kind === 'consulta' ? 'Pedir entrevista' : 'Reservar'}</ReservarBtn>
            : <Link className="btn dark sm" href={`/cursos/${c.slug}`}>Ver detalle</Link>}
        </div>
      </div>
    </article>
  );
}

export function Cursos({ catalogo }: { catalogo: Curso[] }) {
  return (
    <section className="sec cursos" id="cursos">
      <div className="wrap">
        <p className="eyebrow">Propuestas</p>
        <h2 style={{ marginTop: 10 }}>Cursos y sesiones</h2>
        <p className="sec-sub">Para aprender en grupo o a tu medida, en el estudio o desde tu casa.</p>
        <FiltroCursos>{catalogo.filter((c) => c.kind !== 'regalo').map((c) => <TarjetaCurso key={c.id} c={c} />)}</FiltroCursos>
      </div>
    </section>
  );
}

/* ---------- Resto de la portada ---------- */

export function Pasos() {
  return (
    <section className="sec pasos" id="pasos">
      <div className="wrap">
        <p className="eyebrow">Reservar</p>
        <h2 style={{ marginTop: 10 }}>Tu lugar en tres pasos</h2>
        <ol className="steps">{PASOS.map((p) => <li key={p.t}><b>{p.t}</b><span>{p.d}</span></li>)}</ol>
      </div>
    </section>
  );
}

export function Sobre() {
  return (
    <section className="sec about" id="steph">
      <div className="wrap about-in">
        <div className="arch"><Image src="/img/steph.jpg" alt="Steph sosteniendo un abanico de colores frente a su perchero" fill sizes="(max-width:980px) 380px, 440px" style={{ objectFit: 'cover', objectPosition: '30% 50%' }} /></div>
        <div>
          <p className="eyebrow">Sobre Steph</p>
          <h2>Productora de moda, maquilladora profesional y docente.</h2>
          <p>Durante más de 10 años trabajé en empresas multinacionales, en áreas de experiencia del cliente, comunicación y liderazgo de equipos. Hoy desarrollo mi propio espacio de imagen personal, maquillaje y formación para mujeres, donde creo y dicto propuestas sobre moda, color e imagen, enfocadas en potenciar la identidad y el estilo propio.</p>
          <blockquote>“Nos vemos en clase para aprender sobre moda, imagen y color.”</blockquote>
          <ul className="chips"><li>Facultad de Diseño y Comunicación, UP</li><li>Docente en la Universidad de Palermo</li><li>+10 años en multinacionales</li></ul>
        </div>
      </div>
    </section>
  );
}

export function Resenas({ aj }: { aj: AjustesPublicos }) {
  return (
    <section className="sec resenas" id="resenas">
      <div className="wrap">
        <p className="eyebrow">Reseñas</p>
        <h2 style={{ marginTop: 10 }}>Lo que cuentan las alumnas</h2>
        <div className="rev">{RESENAS.map((r) => <figure key={r.autora}><blockquote>“{r.texto}”</blockquote><figcaption>{r.autora}</figcaption></figure>)}</div>
        {aj.linkResena && <p className="rev-more"><a href={aj.linkResena} target="_blank" rel="noopener">Ver las más de 110 reseñas en Google →</a></p>}
      </div>
    </section>
  );
}

export function Regalo({ catalogo }: { catalogo: Curso[] }) {
  const g = catalogo.find((c) => c.kind === 'regalo');
  if (!g) return null;
  return (
    <section className="sec regalo" id="regalo">
      <div className="wrap regalo-in">
        <div className="ticket" role="img" aria-label={`Pase al camerino, gift card de ${g.precio} pesos`}>
          <div className="t-stub">Pase al camerino</div>
          <div className="t-main"><p className="eyebrow">Gift card</p><h3>Una sesión de maquillaje, color e imagen</h3><p>Automaquillaje + colorimetría, con Steph.</p>
            <div className="t-price">{peso(g.precio)}{g.precioLista && <s>{peso(g.precioLista)}</s>}</div></div>
        </div>
        <div>
          <p className="eyebrow">Regalá experiencias</p>
          <h2>Un regalo para aprender, no para guardar en un cajón.</h2>
          <p>Ideal para cumpleaños, aniversarios, celebraciones especiales o simplemente para sorprender a alguien con un momento único.</p>
          <ul><li>La recibe por mail, con tu mensaje.</li><li>Vos elegís cuándo se la enviamos.</li><li>Ella elige su fecha cuando quiera.</li></ul>
          <ReservarBtn slug={g.slug} className="btn dark">Regalar una experiencia</ReservarBtn>
        </div>
      </div>
    </section>
  );
}

export function Preguntas({ aj }: { aj: AjustesPublicos }) {
  return (
    <section className="sec faq" id="faq">
      <div className="wrap faq-in">
        <div>
          <p className="eyebrow">Preguntas frecuentes</p>
          <h2 style={{ marginTop: 10 }}>Antes de reservar</h2>
          <div className="news"><h3>Tips de color y nuevas fechas</h3><p>Una vez por semana, en tu mail.</p>
            <Boletin origen="web" ok="Listo, ya estás en la lista." boton="Suscribirme" claro /></div>
        </div>
        <div className="acc">{preguntas(aj.politicaCambios).map((x) => <details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div>
      </div>
    </section>
  );
}
