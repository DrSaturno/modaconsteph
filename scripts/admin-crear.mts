/* Crea (o cambia la clave de) un usuario del panel.
 *   npm run admin:crear -- email@ejemplo.com "Nombre" "clave-larga" [admin|asistente]
 * Usa DATABASE_URL (variables de entorno o .env.local). */
import { readFileSync, existsSync } from 'node:fs';
import postgres from 'postgres';
import { hashClave } from '../src/lib/hash';

if (existsSync('.env.local')) {
  for (const l of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z_]+)=(.*)$/.exec(l);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const [email, nombre, clave, rol = 'admin'] = process.argv.slice(2);
if (!email || !nombre || !clave || clave.length < 10 || !['admin', 'asistente'].includes(rol)) {
  console.error('Uso: npm run admin:crear -- email "Nombre" "clave de 10 caracteres o más" [admin|asistente]');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL. En desarrollo local sin base real, el usuario de prueba ya viene cargado.');
  process.exit(1);
}
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
await sql`insert into admins (email, nombre, rol, password_hash) values (${email.toLowerCase()}, ${nombre}, ${rol}, ${hashClave(clave)})
          on conflict (email) do update set nombre = excluded.nombre, rol = excluded.rol, password_hash = excluded.password_hash`;
console.log(`Listo: ${email} puede entrar al panel como ${rol}.`);
await sql.end();
