import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify, SignJWT } from 'jose';
import { query } from './db';
import { claveCorrecta } from './hash';

/* Acceso al panel: email + clave. La clave se guarda con scrypt; la sesión es una cookie firmada (7 días). */

export const COOKIE = 'mcs_admin';
const DIAS = 7;

function secreto(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') throw new Error('Falta SESSION_SECRET (32 caracteres o más).');
    return new TextEncoder().encode('secreto-solo-para-desarrollo-local-0123456789');
  }
  return new TextEncoder().encode(s);
}

export type Admin = { id: string; email: string; nombre: string; rol: 'admin' | 'asistente' };

export async function iniciarSesion(email: string, clave: string, ip: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const mail = email.trim().toLowerCase();
  const fallos = await query<{ n: number }>(
    `select count(*)::int as n from login_intentos where ok = false and en > now() - interval '15 minutes' and (lower(email) = $1 or ip = $2)`, [mail, ip]);
  if (fallos[0].n >= 8) return { ok: false, error: 'Demasiados intentos. Esperá 15 minutos y probá de nuevo.' };

  const a = (await query(`select * from admins where lower(email) = $1`, [mail]))[0];
  // si el usuario no existe, igual se calcula un hash: así no se nota la diferencia en el tiempo de respuesta
  const ok = a ? claveCorrecta(clave, a.password_hash) : (claveCorrecta(clave, 'scrypt$00$00'), false);
  await query(`insert into login_intentos (email, ip, ok) values ($1, $2, $3)`, [mail, ip, ok]);
  if (!ok || !a) return { ok: false, error: 'El email o la clave no coinciden.' };

  const token = await new SignJWT({ rol: a.rol })
    .setProtectedHeader({ alg: 'HS256' }).setSubject(a.id).setIssuedAt().setExpirationTime(`${DIAS}d`).sign(secreto());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: DIAS * 86400,
  });
  return { ok: true };
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

/** Quién está logueado (o null). Se calcula una vez por pedido. */
export const adminActual = cache(async (): Promise<Admin | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secreto(), { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    const a = (await query(`select id, email, nombre, rol from admins where id = $1`, [payload.sub]))[0];
    return (a as Admin) ?? null;
  } catch {
    return null;
  }
});

/** Todo lo que cambia datos llama a esto primero. Con `soloAdmin` rechaza a las asistentes. */
export async function requerirAdmin(opts: { soloAdmin?: boolean } = {}): Promise<Admin> {
  const a = await adminActual();
  if (!a) redirect('/admin/login');
  if (opts.soloAdmin && a.rol !== 'admin') redirect('/admin?sin_permiso=1');
  return a;
}

export async function ipActual(): Promise<string> {
  const h = await headers();
  return (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'local';
}
