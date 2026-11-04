import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

export type Correo = { de: { nombre: string; email: string }; para: string; asunto: string; html: string; texto: string; responderA?: string };

/**
 * Proveedor según las variables de entorno: RESEND_API_KEY o BREVO_API_KEY.
 * Sin ninguno, en desarrollo (o con MCS_MAILS_A_CARPETA=1) guarda el mail en `.data/mails/` para poder verlo; en producción falla (y la cola reintenta).
 */
export async function enviarCorreo(c: Correo): Promise<void> {
  if (process.env.RESEND_API_KEY) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `${c.de.nombre} <${c.de.email}>`, to: [c.para], subject: c.asunto, html: c.html, text: c.texto, reply_to: c.responderA }),
    });
    if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return;
  }
  if (process.env.BREVO_API_KEY) {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: c.de.nombre, email: c.de.email }, to: [{ email: c.para }], subject: c.asunto,
        htmlContent: c.html, textContent: c.texto, ...(c.responderA ? { replyTo: { email: c.responderA } } : {}),
      }),
    });
    if (!r.ok) throw new Error(`Brevo ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return;
  }
  if (process.env.VERCEL || (process.env.NODE_ENV === 'production' && process.env.MCS_MAILS_A_CARPETA !== '1')) throw new Error('Falta RESEND_API_KEY o BREVO_API_KEY: no hay con qué enviar mails.');
  const dir = path.join(process.cwd(), '.data', 'mails');
  fs.mkdirSync(dir, { recursive: true });
  const nombre = `${new Date().toISOString().replace(/[:.]/g, '-')}_${c.para.replace(/[^a-z0-9@.+-]/gi, '_')}.html`;
  fs.writeFileSync(path.join(dir, nombre), `<!-- Para: ${c.para} · Asunto: ${c.asunto} -->\n${c.html}`);
  console.log(`[mail de desarrollo] para ${c.para}: ${c.asunto} → .data/mails/${nombre}`);
}
