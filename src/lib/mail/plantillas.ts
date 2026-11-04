import { siteUrl } from '../ajustes';

/** Reemplaza [nombre], [curso], [quien regala]… por su valor. Lo que no se conoce queda tal cual, para que se note. */
export function sustituir(texto: string, vars: Record<string, string>): string {
  const out = texto.replace(/\[([^\]\n]+)\]/g, (m, k: string) => {
    const clave = k.trim().toLowerCase().replace(/\s+/g, '_');
    return clave in vars ? vars[clave] : m;
  });
  return out.replace(/Hola ,/g, 'Hola,').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function linkear(s: string): string {
  return s.replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" style="color:#9B3F6E;font-weight:600">${u}</a>`);
}

/** Texto plano (como lo escribe Steph) a un mail con la marca. */
export function aHtml(texto: string): string {
  const cuerpo = texto
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2A1330">${linkear(esc(p)).replace(/\n/g, '<br>')}</p>`)
    .join('');
  const base = siteUrl();
  return `<!doctype html><html lang="es"><body style="margin:0;padding:0;background:#FBEFF4">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBEFF4"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:Poppins,Helvetica,Arial,sans-serif">
<tr><td style="background:#241029;border-radius:20px 20px 0 0;padding:22px 28px"><img src="${base}/img/logo.png" alt="Moda con Steph" height="40" style="display:block;height:40px;width:auto"></td></tr>
<tr><td style="background:#ffffff;padding:30px 28px 14px">${cuerpo}</td></tr>
<tr><td style="background:#ffffff;border-radius:0 0 20px 20px;padding:0 28px 26px"><p style="margin:0;border-top:1px solid #F0DCE6;padding-top:16px;font-size:12px;color:#6A4B72">Moda con Steph · Estudio de maquillaje e imagen · Belgrano, CABA</p></td></tr>
</table></td></tr></table></body></html>`;
}
