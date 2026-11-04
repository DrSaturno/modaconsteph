import 'server-only';
import { query } from './db';

export type AjustesAll = {
  hold_horas: number;
  mp_hold_min: number;
  whatsapp: string;
  mail_steph: string;
  remitente_nombre: string;
  remitente_email: string;
  direccion_estudio: string;
  link_resena: string;
  instagram: string;
  transferencia: { titular: string; cuit: string; banco: string; cbu: string; alias: string };
  exterior: { instrucciones: string; link: string };
  politica_cambios: string;
};

const PorDefecto: AjustesAll = {
  hold_horas: 24, mp_hold_min: 60, whatsapp: '', mail_steph: '', remitente_nombre: 'Moda con Steph', remitente_email: '',
  direccion_estudio: '', link_resena: '', instagram: '',
  transferencia: { titular: '', cuit: '', banco: '', cbu: '', alias: '' }, exterior: { instrucciones: '', link: '' }, politica_cambios: '',
};

/** Todos los ajustes, sin caché (se usa en acciones, no en páginas). */
export async function leerAjustes(): Promise<AjustesAll> {
  const rows = await query<{ clave: string; valor: unknown }>(`select clave, valor from ajustes`);
  const a: Record<string, unknown> = { ...PorDefecto };
  for (const r of rows) a[r.clave] = r.valor;
  return a as AjustesAll;
}

export function siteUrl(): string {
  return (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}
