/*
 * Carátulas de los cursos: una pieza gráfica propia para cada curso, con la misma familia visual de la web
 * (ciruela, rosa, luz de camerino). Se arman con datos, sin subir imágenes: Steph elige ilustración y colores.
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
};

export const PALETAS = {
  ciruela: {
    nombre: 'Ciruela', fondo: '#241029', fondo2: '#4D2660', tinta: '#F7E9F0', tinta2: '#D9C3D2', linea: 'rgba(247,233,240,.24)',
    rampa: ['#FFF0CC', '#F3D2E0', '#EBBFD4', '#D99BBA', '#C680A2', '#B25A89', '#9B3F6E'],
    centro: '#FFD58A', marco: '#F7F0F3', vidrio: '#EAD2DE',
  },
  berry: {
    nombre: 'Frutilla', fondo: '#8E3764', fondo2: '#B8588D', tinta: '#FFF0CC', tinta2: '#FFE3EE', linea: 'rgba(255,240,204,.34)',
    rampa: ['#FFF0CC', '#FFD58A', '#F6C2D6', '#EBBFD4', '#D78FB2', '#6E2A5C', '#4A1B3E'],
    centro: '#241029', marco: '#F7F0F3', vidrio: '#EBBFD4',
  },
  rosa: {
    nombre: 'Rosa', fondo: '#EBBFD4', fondo2: '#FADDE9', tinta: '#241029', tinta2: '#5C2A4C', linea: 'rgba(36,16,41,.22)',
    rampa: ['#FBEFF4', '#F5DEE8', '#D99BBA', '#C680A2', '#9B3F6E', '#6E2A5C', '#241029'],
    centro: '#241029', marco: '#241029', vidrio: '#FBEFF4',
  },
  luz: {
    nombre: 'Luz', fondo: '#FFD58A', fondo2: '#FFEBC4', tinta: '#241029', tinta2: '#552846', linea: 'rgba(36,16,41,.22)',
    rampa: ['#FFF0CC', '#F7C6D6', '#E39AB8', '#C680A2', '#9B3F6E', '#6E2A5C', '#241029'],
    centro: '#241029', marco: '#241029', vidrio: '#FBEFF4',
  },
  durazno: {
    nombre: 'Durazno', fondo: '#F2BFA8', fondo2: '#FBDCCB', tinta: '#241029', tinta2: '#552846', linea: 'rgba(36,16,41,.22)',
    rampa: ['#FFF0CC', '#F7B7A3', '#E58F8F', '#C680A2', '#9B3F6E', '#6E2A5C', '#241029'],
    centro: '#241029', marco: '#241029', vidrio: '#FBEFF4',
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
export function tamanoTitulo(titulo: string, ancho = 56): number {
  const palabras = titulo.trim().split(/\s+/).filter(Boolean);
  for (let fs = 12.4; fs > 6.2; fs -= 0.4) {
    const cap = ancho / (fs * 0.5);
    let lineas = 1, actual = 0, cabe = true;
    for (const p of palabras) {
      if (p.length > cap) { cabe = false; break; }
      const largo = actual ? actual + 1 + p.length : p.length;
      if (largo > cap) { lineas++; actual = p.length; } else actual = largo;
    }
    if (cabe && lineas <= 3) return Math.round(fs * 10) / 10;
  }
  return 6.2;
}
