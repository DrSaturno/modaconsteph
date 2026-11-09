/*
 * Seguimiento en el navegador. Todo pasa por la "capa de datos" (dataLayer) de Google Tag Manager:
 * la web avisa qué pasó y las etiquetas del contenedor (Analytics, Pixel de Meta) deciden qué hacer con eso.
 * Si algo falla, nunca rompe la página: el seguimiento es un extra, no puede frenar una reserva.
 */

import { GA4_ID } from './ids';

type Evento = Record<string, unknown>;
declare global {
  interface Window { dataLayer?: Evento[]; google_tag_manager?: Record<string, unknown> }
}

export type Item = { item_id: string; item_name: string; item_category?: string; item_variant?: string; price?: number; quantity: number };

export function itemDeCurso(c: { slug: string; nombre: string; tipo: string }, precio: number | null, variante?: string): Item {
  return { item_id: c.slug, item_name: c.nombre, item_category: c.tipo, ...(variante ? { item_variant: variante } : {}), ...(precio != null ? { price: precio } : {}), quantity: 1 };
}

/**
 * Manda un evento a la capa de datos. `ecommerce` va aparte, como pide Google Analytics 4.
 * Con `alTerminar` espera a que las etiquetas hayan disparado antes de seguir (sirve para cuando la página
 * está por cambiar: si no, el navegador corta el pedido al Pixel y el evento se pierde).
 * Si el Tag Manager no está cargado (desarrollo, bloqueadores), sigue de inmediato.
 */
export function evento(nombre: string, datos: Evento = {}, ecommerce?: { value?: number; items: Item[] }, alTerminar?: () => void): void {
  let seguido = false;
  const seguir = () => { if (!seguido) { seguido = true; alTerminar?.(); } };
  try {
    if (typeof window === 'undefined') return seguir();
    const dl = (window.dataLayer = window.dataLayer || []);
    if (ecommerce) dl.push({ ecommerce: null }); // limpia el ecommerce anterior (recomendación de Google)
    const cargado = !!window.google_tag_manager;
    dl.push({
      event: nombre, ...datos,
      ...(ecommerce ? { ecommerce: { currency: 'ARS', ...ecommerce } } : {}),
      ...(alTerminar && cargado ? { eventCallback: () => setTimeout(seguir, 250), eventTimeout: 800 } : {}),
    });
    if (alTerminar) { if (cargado) setTimeout(seguir, 1200); else seguir(); }
  } catch { seguir(); } // el seguimiento nunca rompe la web
}

/* ---------- De dónde viene cada visita (anuncio, campaña, etc.) ---------- */

export type Origen = {
  utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string;
  fbclid?: string; gclid?: string; referrer?: string; landing?: string; ts?: number;
};
type Guardado = { primero?: Origen; ultimo?: Origen };
const CLAVE = 'mcs_origen';
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'] as const;
const corto = (s: string | null | undefined, n = 200) => (s ?? '').slice(0, n);

function leerGuardado(): Guardado {
  try { return JSON.parse(window.localStorage.getItem(CLAVE) || '{}') as Guardado; } catch { return {}; }
}

/** Anota de dónde llegó la visita. Se llama al entrar y se conserva la primera visita y la última con campaña. */
export function registrarOrigen(): void {
  try {
    const url = new URL(window.location.href);
    const o: Origen = { landing: corto(url.pathname), ts: Date.now() };
    let conCampania = false;
    for (const k of PARAMS) {
      const v = url.searchParams.get(k);
      if (v) { o[k] = corto(v); conCampania = true; }
    }
    let ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch { /* sin referrer */ }
    if (ref && ref !== window.location.hostname) o.referrer = corto(ref);
    const g = leerGuardado();
    if (!g.primero) g.primero = o;
    // la "última" solo se pisa cuando llega con campaña o desde otro sitio: navegar adentro no la borra
    if (conCampania || o.referrer || !g.ultimo) g.ultimo = o;
    window.localStorage.setItem(CLAVE, JSON.stringify(g));
  } catch { /* sin almacenamiento: se sigue sin origen */ }
}

function cookie(nombre: string): string {
  try {
    const m = document.cookie.split('; ').find((c) => c.startsWith(nombre + '='));
    return m ? decodeURIComponent(m.slice(nombre.length + 1)) : '';
  } catch { return ''; }
}

export type Rastreo = {
  fbp?: string; fbc?: string; gaClientId?: string; gaSessionId?: string; url?: string;
  primero?: Origen; ultimo?: Origen;
};

/** Lo que el servidor necesita para contar la compra de esta alumna en Meta y Analytics aunque se confirme horas después. */
export function leerRastreo(): Rastreo {
  try {
    const g = leerGuardado();
    const fbp = cookie('_fbp');
    let fbc = cookie('_fbc');
    const fbclid = g.ultimo?.fbclid || g.primero?.fbclid;
    if (!fbc && fbclid) fbc = `fb.1.${g.ultimo?.ts ?? Date.now()}.${fbclid}`;
    // cookie _ga: GA1.1.1234567890.1234567890 → el identificador es lo que sigue a "GA1.1."
    const ga = cookie('_ga').split('.');
    const gaClientId = ga.length >= 4 ? `${ga[2]}.${ga[3]}` : '';
    // cookie _ga_<ID>: GS2.1.s1700000000$o1... (o GS1.1.1700000000.1...)
    const gs = cookie('_ga_' + GA4_ID.replace('G-', ''));
    const gaSessionId = /s(\d{9,11})/.exec(gs)?.[1] || /^GS1\.\d\.(\d{9,11})\./.exec(gs)?.[1] || '';
    return {
      ...(fbp ? { fbp: corto(fbp, 120) } : {}), ...(fbc ? { fbc: corto(fbc, 200) } : {}),
      ...(gaClientId ? { gaClientId: corto(gaClientId, 60) } : {}), ...(gaSessionId ? { gaSessionId } : {}),
      url: corto(window.location.href, 400), primero: g.primero, ultimo: g.ultimo,
    };
  } catch { return {}; }
}
