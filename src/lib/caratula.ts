/*
 * Carátulas de los cursos: una pieza gráfica propia para cada curso, con la misma familia visual de la web
 * (la paleta de la clienta y las luces de camerino). Se arman con datos, sin subir imágenes: Steph elige ilustración y colores.
 * Este archivo no depende del servidor: lo usan la web, el panel y la imagen para compartir.
 */

export const MOTIVOS = [
  { id: 'abanico', nombre: 'Abanico de colores' },
  { id: 'mezcla', nombre: 'Mezcla de pigmentos' },
  { id: 'espejo', nombre: 'Espejo de camerino' },
  { id: 'arco', nombre: 'Arcos' },
  { id: 'perchero', nombre: 'Perchero' },
  { id: 'labial', nombre: 'Labial' },
  { id: 'regalo', nombre: 'Regalo' },
] as const;
export type Motivo = (typeof MOTIVOS)[number]['id'];

/** Colores de Moda con Steph (los mismos de src/app/paleta.css; fuente: brand/paleta-de-colores.jpg). No se usa ninguno más. */
export const FONDO = '#FAF6F7'; // crema
export const LETRA = '#2B2B2B'; // grafito
export const TITULO = '#D07AA3'; // rosa principal
export const ROSA_CLARO = '#F3DCE6';
export const TAUPE = '#C9B7B6';
export const MALVA = '#8C5A7D'; // malva profundo, acento
export const SALVIA = '#A3AC99'; // verde salvia (2026-11-11): solo detalles, nunca texto

const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
/** Mezcla de dos colores de la paleta: t = 0 es `a`, t = 1 es `b`. */
export function mezcla(a: string, b: string, t: number): string {
  return `#${[0, 1, 2].map((i) => Math.round(canal(a, i) * (1 - t) + canal(b, i) * t).toString(16).padStart(2, '0')).join('')}`;
}
export const conAlfa = (hex: string, alfa: number) => `rgba(${canal(hex, 0)},${canal(hex, 1)},${canal(hex, 2)},${alfa})`;

const clara = (t: number) => mezcla(FONDO, TITULO, t); // del fondo al rosa
const oscura = (t: number) => mezcla(TITULO, LETRA, t); // del rosa a las letras

export type PaletaDef = {
  nombre: string;
  fondo: string;
  /** Luz del degradé, arriba a la derecha. */
  fondo2: string;
  tinta: string;
  /** Textos chicos: siempre con contraste suficiente sobre el fondo. */
  tinta2: string;
  linea: string;
  /** Siete tonos de la misma familia, de claro a oscuro: de acá salen los colores de cada ilustración. */
  rampa: readonly string[];
  /** Donde se cruzan las tres mezclas. */
  centro: string;
  marco: string;
  vidrio: string;
  /** Chispas y lucecitas de los lugares: se ven sobre el fondo. */
  chispa: string;
  /** Bombitas del espejo: se ven sobre el marco. */
  bombita: string;
  /** Detalles que resaltan sobre las prendas y los regalos (moño, tapa del labial). */
  acento: string;
  /** Reflejos del vidrio. */
  reflejo: string;
};

const ROSA_PROFUNDO = MALVA;

export const PALETAS = {
  ciruela: {
    nombre: 'Noche', fondo: LETRA, fondo2: mezcla(LETRA, TITULO, 0.24), tinta: FONDO, tinta2: mezcla(LETRA, FONDO, 0.78), linea: conAlfa(FONDO, 0.24),
    rampa: [FONDO, clara(0.25), clara(0.5), clara(0.75), TITULO, oscura(0.3), oscura(0.52)],
    centro: FONDO, marco: FONDO, vidrio: clara(0.3), chispa: FONDO, bombita: TITULO, acento: FONDO, reflejo: FONDO,
  },
  berry: {
    nombre: 'Rosa', fondo: TITULO, fondo2: mezcla(TITULO, FONDO, 0.3), tinta: LETRA, tinta2: LETRA, linea: conAlfa(LETRA, 0.28),
    rampa: [FONDO, clara(0.16), clara(0.34), clara(0.52), oscura(0.5), oscura(0.72), LETRA],
    centro: LETRA, marco: FONDO, vidrio: clara(0.22), chispa: FONDO, bombita: TITULO, acento: LETRA, reflejo: FONDO,
  },
  rosa: {
    nombre: 'Claro', fondo: FONDO, fondo2: clara(0.22), tinta: LETRA, tinta2: mezcla(LETRA, FONDO, 0.25), linea: conAlfa(LETRA, 0.2),
    rampa: [clara(0.3), clara(0.5), clara(0.75), TITULO, oscura(0.35), oscura(0.6), LETRA],
    centro: LETRA, marco: LETRA, vidrio: clara(0.2), chispa: TITULO, bombita: FONDO, acento: LETRA, reflejo: FONDO,
  },
  luz: {
    nombre: 'Rosa suave', fondo: ROSA_CLARO, fondo2: mezcla(ROSA_CLARO, FONDO, 0.5), tinta: LETRA, tinta2: mezcla(LETRA, FONDO, 0.12), linea: conAlfa(LETRA, 0.22),
    rampa: [FONDO, clara(0.18), TITULO, oscura(0.25), oscura(0.45), oscura(0.65), LETRA],
    centro: LETRA, marco: LETRA, vidrio: clara(0.1), chispa: FONDO, bombita: FONDO, acento: FONDO, reflejo: FONDO,
  },
  durazno: {
    nombre: 'Rosa profundo', fondo: ROSA_PROFUNDO, fondo2: mezcla(ROSA_PROFUNDO, TITULO, 0.45), tinta: FONDO, tinta2: FONDO, linea: conAlfa(FONDO, 0.3),
    rampa: [FONDO, clara(0.25), clara(0.5), clara(0.75), TITULO, oscura(0.7), LETRA],
    centro: FONDO, marco: FONDO, vidrio: clara(0.3), chispa: FONDO, bombita: TITULO, acento: FONDO, reflejo: FONDO,
  },
} as const satisfies Record<string, PaletaDef>;
export type Paleta = keyof typeof PALETAS;
export const PALETAS_ORDEN = Object.keys(PALETAS) as Paleta[];

/** Lo que se guarda de cada curso. Título y detalle vacíos = se arman solos. */
export type CaratulaCfg = { motivo: Motivo; paleta: Paleta; titulo: string; detalle: string };

export type CaratulaProps = {
  motivo: Motivo;
  paleta: Paleta;
  titulo: string;
  detalle: string;
  /** Lucecitas encendidas: una por lugar del grupo (como en la agenda). */
  luces: number;
};

const esMotivo = (v: unknown): v is Motivo => MOTIVOS.some((m) => m.id === v);
const esPaleta = (v: unknown): v is Paleta => typeof v === 'string' && v in PALETAS;

const MOTIVO_POR_TIPO: Record<string, Motivo> = { presencial: 'abanico', online: 'mezcla', '1a1': 'espejo', regalo: 'regalo' };

/** Completa lo que falte: un curso nuevo ya sale con una carátula prolija, aunque nadie la haya elegido. */
export function normalizarCaratula(raw: unknown, tipo: string, orden = 0): CaratulaCfg {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    motivo: esMotivo(r.motivo) ? r.motivo : MOTIVO_POR_TIPO[tipo] ?? 'abanico',
    paleta: esPaleta(r.paleta) ? r.paleta : PALETAS_ORDEN[Math.abs(orden) % PALETAS_ORDEN.length],
    titulo: typeof r.titulo === 'string' ? r.titulo.slice(0, 40) : '',
    detalle: typeof r.detalle === 'string' ? r.detalle.slice(0, 48) : '',
  };
}

type CursoMin = {
  nombre: string; corto?: string; tipo: string; kind: string; duracion: string;
  caratula?: unknown; orden?: number; fechas?: readonly { cupo: number }[];
};

/** Cuántas alumnas entran: el mayor cupo entre las fechas que vienen (null = no hay fechas). */
export function cupoDe(c: Pick<CursoMin, 'fechas'>): number | null {
  const cupos = (c.fechas ?? []).map((f) => f.cupo);
  return cupos.length ? Math.max(...cupos) : null;
}

export function lucesDe(c: Pick<CursoMin, 'tipo' | 'kind'>, cupo: number | null): number {
  if (c.tipo === 'regalo' || c.tipo === 'online' || c.kind === 'consulta') return 0;
  if (c.tipo === '1a1' || c.kind === 'slot') return 1;
  return Math.max(1, Math.min(6, cupo ?? 4));
}

function detalleAuto(c: CursoMin, cupo: number | null): string {
  const base =
    c.tipo === 'presencial' ? (cupo ? `Hasta ${cupo} alumnas` : 'En el estudio')
    : c.tipo === 'online' ? 'Online en vivo'
    : c.tipo === 'regalo' ? 'Para regalar'
    : c.kind === 'consulta' ? 'Entrevista inicial' : '1 a 1';
  return [base, c.duracion && c.duracion !== base ? c.duracion : ''].filter(Boolean).join(' · ');
}

/** Todo lo que necesita dibujar la carátula de un curso, de la web o del panel. */
export function propsCaratula(c: CursoMin, cupo: number | null = cupoDe(c)): CaratulaProps {
  const cfg = normalizarCaratula(c.caratula, c.tipo, c.orden);
  return {
    motivo: cfg.motivo,
    paleta: cfg.paleta,
    titulo: cfg.titulo.trim() || c.corto?.trim() || c.nombre,
    detalle: cfg.detalle.trim() || detalleAuto(c, cupo),
    luces: lucesDe(c, cupo),
  };
}

/** Huella corta de lo que se dibuja: cambia cuando cambia la carátula (sirve para la dirección de la imagen que se comparte). */
export function huellaCaratula(c: CaratulaProps): string {
  let h = 2166136261;
  for (const ch of JSON.stringify([c.motivo, c.paleta, c.titulo, c.detalle, c.luces])) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36);
}

/** Tamaño del título (en % del ancho de la carátula): el más grande que entra en tres renglones sin partir palabras. */
export function tamanoTitulo(titulo: string, ancho = 48): number {
  const palabras = titulo.trim().split(/\s+/).filter(Boolean);
  for (let fs = 11.6; fs > 5.2; fs -= 0.4) {
    const cap = ancho / (fs * 0.62); // Poppins Bold: cada letra mide cerca de 0,62 veces el cuerpo
    let lineas = 1, actual = 0, cabe = true;
    for (const p of palabras) {
      if (p.length > cap) { cabe = false; break; }
      const largo = actual ? actual + 1 + p.length : p.length;
      if (largo > cap) { lineas++; actual = p.length; } else actual = largo;
    }
    if (cabe && lineas <= 3) return Math.round(fs * 10) / 10;
  }
  return 5.2;
}
