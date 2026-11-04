/* Lectura de formularios del panel. Sin dependencias del servidor. */

export const texto = (f: FormData, k: string): string => String(f.get(k) ?? '').trim();
export const lineas = (f: FormData, k: string): string[] => texto(f, k).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

export function entero(f: FormData, k: string): number | null {
  const v = texto(f, k).replace(/[^\d]/g, '');
  return v ? parseInt(v, 10) : null;
}

export function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'curso';
}

/** "2026-12-12" + "11:00" → instante en hora de Buenos Aires (UTC-3, sin horario de verano). */
export function instanteAR(fecha: string, hhmm: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
  const d = new Date(`${fecha}T${hhmm}:00-03:00`);
  return isNaN(d.getTime()) ? null : d;
}

/** Saca la hora de comienzo de un texto como "11:00 a 13:30" o "19 h". */
export function horaDeInicio(horario: string): string | null {
  const m = /(\d{1,2})\s*[:.h]\s*(\d{2})?/.exec(horario);
  if (!m) return null;
  const h = parseInt(m[1], 10), min = m[2] ? parseInt(m[2], 10) : 0;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Teléfono argentino escrito de cualquier forma → número para wa.me (54 9 + área + número). */
export function numeroWhatsApp(tel: string): string {
  let d = tel.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('54')) { if (!d.startsWith('549')) d = '549' + d.slice(2); return d; }
  if (d.startsWith('0')) d = d.slice(1);
  d = d.replace(/^(\d{2,4})15(\d{6,8})$/, '$1$2'); // quita el 15 del celular
  return '549' + d;
}

export function linkWhatsApp(tel: string, mensaje: string): string {
  return `https://wa.me/${numeroWhatsApp(tel)}?text=${encodeURIComponent(mensaje)}`;
}
