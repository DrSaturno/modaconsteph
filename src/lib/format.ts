/* Formatos y precios. Sin dependencias de servidor: lo usan tanto el servidor como el navegador. */
import type { Curso } from './tipos';

export const TZ = 'America/Argentina/Buenos_Aires';

export function peso(n: number | null | undefined): string {
  if (n == null) return '';
  return '$ ' + Math.round(n).toLocaleString('es-AR');
}

const dtf = new Intl.DateTimeFormat('es-AR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const corto = new Intl.DateTimeFormat('es-AR', { timeZone: TZ, weekday: 'short', month: 'short' });

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function partes(iso: string) {
  const d = new Date(iso);
  const p = Object.fromEntries(dtf.formatToParts(d).map((x) => [x.type, x.value]));
  const c = Object.fromEntries(corto.formatToParts(d).map((x) => [x.type, x.value]));
  return {
    diaLargo: cap(p.weekday),
    diaCorto: cap(String(c.weekday).replace('.', '')),
    num: String(Number(p.day)),
    mesLargo: p.month,
    mesCorto: String(c.month).replace('.', ''),
    hora: `${p.hour}:${p.minute}`,
  };
}

/** "Sábado 14 de noviembre" */
export function fechaLarga(iso: string): string {
  const p = partes(iso);
  return `${p.diaLargo} ${p.num} de ${p.mesLargo}`;
}

/** Fecha de una edición, con las otras clases si las hay: "Martes 10 de noviembre, y 12, 17 y 19 de noviembre". */
export function etiquetaFecha(f: { inicio: string; otrasClases: string }): string {
  if (!f.otrasClases) return fechaLarga(f.inicio);
  const p = partes(f.inicio);
  // "Martes 10, 12, 17 y 19 de noviembre": solo si las otras clases son del mismo mes que la primera
  return f.otrasClases.toLowerCase().includes(p.mesLargo.toLowerCase())
    ? `${p.diaLargo} ${p.num}, ${f.otrasClases}`
    : `${fechaLarga(f.inicio)}, y ${f.otrasClases}`;
}

/** "viernes 6 de noviembre, 15:00" para plazos (en minúscula, dentro de una frase). */
export function momento(iso: string): string {
  const p = partes(iso);
  return `${p.diaLargo.toLowerCase()} ${p.num} de ${p.mesLargo} a las ${p.hora}`;
}

type Precios = { precio: number | null; precio_lista: number | null; precio_hasta: string | Date | null };

/** Precio que rige hoy para una fecha: el de la edición mientras esté vigente, si no el de lista; sin precio propio rige el del curso. */
export function precioEfectivo(
  curso: { precio: number | null; precio_lista: number | null },
  fecha: Precios | null,
  ahora: Date,
): { precio: number | null; lista: number | null } {
  if (fecha && fecha.precio != null) {
    const vigente = !fecha.precio_hasta || new Date(fecha.precio_hasta) > ahora;
    return vigente
      ? { precio: fecha.precio, lista: fecha.precio_lista }
      : { precio: fecha.precio_lista ?? fecha.precio, lista: null };
  }
  return { precio: curso.precio, lista: curso.precio_lista };
}

/** Seña en pesos redondeada a $ 500, o null si el curso no pide seña (o la seña no es menor al precio). */
export function calcularSena(
  curso: { sena_modo: string; sena_valor: number; kind: string },
  precio: number | null,
): number | null {
  if (precio == null || curso.sena_modo === 'ninguna' || !['fecha', 'slot'].includes(curso.kind)) return null;
  const s = curso.sena_modo === 'pct' ? Math.round((precio * curso.sena_valor) / 100 / 500) * 500 : curso.sena_valor;
  return s > 0 && s < precio ? s : null;
}

export function cuposTexto(libres: number, cupo: number): string {
  if (libres <= 0) return 'Sin lugares';
  return libres <= 2 ? `Últimos lugares: quedan ${libres} de ${cupo}` : `Quedan ${libres} de ${cupo} lugares`;
}

export const TIPO_ROTULO: Record<Curso['tipo'], string> = { presencial: 'Presencial', online: 'Online', '1a1': '1 a 1', regalo: 'Regalo' };

export function esEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

/** "2026-12-12" en hora de Buenos Aires, para los campos de fecha del panel. */
export function ymdAR(iso: string | Date): string {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

/** "sáb 14 nov, 11:00" para listas compactas. */
export function cuando(iso: string | Date): string {
  const p = partes(new Date(iso).toISOString());
  return `${p.diaCorto.toLowerCase()} ${p.num} ${p.mesCorto}, ${p.hora}`;
}
