import crypto from 'node:crypto';

/* Claves del panel: scrypt con sal propia. Sin dependencias de Next para poder usarlo también desde scripts. */

export function hashClave(clave: string): string {
  const sal = crypto.randomBytes(16);
  const h = crypto.scryptSync(clave, sal, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${sal.toString('hex')}$${h.toString('hex')}`;
}

export function claveCorrecta(clave: string, guardada: string): boolean {
  const [tipo, sal, h] = guardada.split('$');
  if (tipo !== 'scrypt' || !sal || !h) return false;
  const calc = crypto.scryptSync(clave, Buffer.from(sal, 'hex'), 64, { N: 16384, r: 8, p: 1 });
  const esperado = Buffer.from(h, 'hex');
  return calc.length === esperado.length && crypto.timingSafeEqual(calc, esperado);
}
