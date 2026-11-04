import type { CaratulaCfg } from './caratula';

export type Tipo = 'presencial' | 'online' | '1a1' | 'regalo';
export type Kind = 'fecha' | 'slot' | 'consulta' | 'regalo';

export type Fecha = {
  id: string;
  cursoId: string;
  edicion: string;
  inicio: string; // ISO
  fin: string | null;
  hora: string;
  otrasClases: string;
  cupo: number;
  libres: number;
  precio: number | null;
  precioLista: number | null;
  /** Monto de seña ya calculado para esta fecha (null = se paga el total). */
  sena: number | null;
};

export type Curso = {
  id: string;
  slug: string;
  nombre: string;
  corto: string;
  tipo: Tipo;
  kind: Kind;
  lugar: string;
  duracion: string;
  resumen: string;
  descripcion: string;
  paraQuien: string;
  incluye: string[];
  programa: string[];
  queTraer: string;
  caratula: CaratulaCfg;
  orden: number;
  precio: number | null;
  precioLista: number | null;
  senaModo: 'ninguna' | 'pct' | 'fijo';
  senaValor: number;
  medios: 'todos' | 'mp' | 'transferencia';
  fechas: Fecha[];
};

export type AjustesPublicos = {
  whatsapp: string;
  instagram: string;
  linkResena: string;
  politicaCambios: string;
};

export type DatosReserva = {
  cursoId: string;
  fechaId: string | null;
  nombre: string;
  email: string;
  tel: string;
  primeraVez: boolean;
  novedades: boolean;
  modo: 'total' | 'sena';
  metodo: 'mp' | 'transferencia' | 'exterior';
  motivo?: string;
  regalo?: { para: string; paraEmail: string; mensaje: string; envio: string };
};

/** Después de reservar, la alumna va a `url`: el checkout de Mercado Pago o la página de su reserva. */
export type ResultadoReserva = { ok: true; url: string } | { ok: false; error: string };
