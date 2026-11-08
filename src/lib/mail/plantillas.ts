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

/* Paleta y tipografía que pidió Steph: fondo, letras y títulos. El resto son tintes de esos mismos colores. */
const FONDO = '#f7f6f4';
const LETRA = '#231f20';
const TITULO = '#c67fa1';
const TINTE = '#f2eaec'; // TITULO al 10 % sobre FONDO
const LINEA = '#e6d3dc';
const SUAVE = '#625f60'; // LETRA al 70 % sobre FONDO, para el pie
const FUENTE = "Poppins,'Helvetica Neue',Helvetica,Arial,sans-serif";

type Bloque =
  | { t: 'texto'; lineas: string[] }
  | { t: 'detalle'; filas: [string, string][] }
  | { t: 'boton'; url: string; etiqueta: string }
  | { t: 'cita'; lineas: string[] }
  | { t: 'firma'; nombre: string };

const URL_RE = /https?:\/\/[^\s<]+/;
const ETIQUETA_RE = /^([^\s:][^:\n]{0,29}):\s+(\S.*)$/;

function etiquetaBoton(intro: string): string {
  if (/panel/i.test(intro)) return 'Abrir el panel';
  if (/rese[ñn]a/i.test(intro)) return 'Dejar mi reseña';
  if (/reserv/i.test(intro)) return 'Reservar mi lugar';
  return 'Abrir enlace';
}

/** Cada párrafo del texto de Steph se vuelve un bloque: texto, "Etiqueta: valor", botón, cita o firma. */
function aBloques(texto: string): Bloque[] {
  const out: Bloque[] = [];
  for (const parrafo of texto.split(/\n{2,}/)) {
    let lineas = parrafo.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());
    if (!lineas.length) continue;
    if (/^[“"][\s\S]*[”"]$/.test(lineas.join(' ').trim())) { out.push({ t: 'cita', lineas }); continue; }
    const firma = lineas[lineas.length - 1].trim() === 'Steph' ? 'Steph' : null;
    if (firma) lineas = lineas.slice(0, -1);
    let txt: string[] = [];
    let det: [string, string][] = [];
    const cerrarTexto = () => { if (txt.length) out.push({ t: 'texto', lineas: txt }); txt = []; };
    const cerrarDetalle = () => { if (det.length) out.push({ t: 'detalle', filas: det }); det = []; };
    for (const linea of lineas) {
      const u = linea.match(URL_RE);
      if (u) {
        const url = u[0].replace(/[.,;:!?)]+$/, '');
        const antes = linea.slice(0, u.index).trim();
        const despues = (linea.slice((u.index ?? 0) + url.length)).trim();
        cerrarDetalle();
        if (antes) txt.push(antes);
        const intro = txt.join(' ');
        if (txt.length) {
          const ult = txt[txt.length - 1];
          if (/:\s*$/.test(ult)) txt[txt.length - 1] = ult.replace(/:\s*$/, ult.split(/\s+/).length > 6 ? '.' : '');
        }
        cerrarTexto();
        out.push({ t: 'boton', url, etiqueta: etiquetaBoton(intro) });
        if (despues) txt.push(despues);
        continue;
      }
      const m = linea.match(ETIQUETA_RE);
      if (m) { cerrarTexto(); det.push([m[1], m[2]]); continue; }
      cerrarDetalle();
      txt.push(linea);
    }
    cerrarTexto();
    cerrarDetalle();
    if (firma) out.push({ t: 'firma', nombre: firma });
  }
  return out;
}

const P = `margin:0 0 16px;font-size:16px;line-height:1.65;color:${LETRA};overflow-wrap:anywhere`;

function bloqueHtml(b: Bloque): string {
  switch (b.t) {
    case 'texto':
      return `<p style="${P}">${b.lineas.map(esc).join('<br>')}</p>`;
    case 'cita':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px"><tr><td style="border-left:3px solid ${TITULO};padding:4px 0 4px 16px;font-size:17px;line-height:1.6;font-style:italic;color:${LETRA}">${b.lineas.map(esc).join('<br>')}</td></tr></table>`;
    case 'detalle':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px"><tr><td style="background:${TINTE};border-left:3px solid ${TITULO};border-radius:0 12px 12px 0;padding:14px 18px">${
        b.filas.map(([k, v], i) => `<p style="margin:0 0 ${i === b.filas.length - 1 ? 0 : 6}px;font-size:15px;line-height:1.55;color:${LETRA};overflow-wrap:anywhere"><span style="font-weight:600">${esc(k)}:</span> ${esc(v)}</p>`).join('')
      }</td></tr></table>`;
    case 'boton':
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 22px"><tr><td bgcolor="${LETRA}" style="border-radius:999px"><a href="${esc(b.url)}" style="display:inline-block;padding:14px 30px;font-family:${FUENTE};font-size:15px;font-weight:600;line-height:1.2;color:${FONDO};text-decoration:none;border-radius:999px">${esc(b.etiqueta)}</a></td></tr></table>`;
    case 'firma':
      return `<p style="margin:6px 0 0;font-family:${FUENTE};font-size:20px;font-weight:600;line-height:1.3;color:${TITULO}">${esc(b.nombre)}</p>`;
  }
}

/** Texto plano (como lo escribe Steph) a un mail con la marca: logo, paleta del cliente y títulos en Poppins. */
export function aHtml(texto: string, titulo = ''): string {
  const base = siteUrl();
  const cuerpo = aBloques(texto).map(bloqueHtml).join('');
  const preheader = esc(texto.replace(/^Hola[^\n]*\n+/, '').replace(/\s+/g, ' ').trim().slice(0, 110));
  const h1 = titulo
    ? `<tr><td class="pad" style="padding:22px 36px 14px"><h1 class="h1" style="margin:0;font-family:${FUENTE};font-size:26px;font-weight:600;line-height:1.25;color:${TITULO}">${esc(titulo)}</h1></td></tr>`
    : '';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(titulo || 'Moda con Steph')}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
<style>body{margin:0}@media (max-width:620px){.pad{padding-left:22px!important;padding-right:22px!important}.h1{font-size:22px!important}}</style></head>
<body style="margin:0;padding:0;background:${FONDO};color:${LETRA};font-family:${FUENTE}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${FONDO}">${preheader}${'&nbsp;&zwnj;'.repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FONDO}">
<tr><td style="height:4px;line-height:4px;font-size:0;background:${TITULO}">&nbsp;</td></tr>
<tr><td align="center" style="padding:0 12px 32px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;font-family:${FUENTE}">
<tr><td align="center" style="padding:36px 36px 4px"><a href="${esc(base)}"><img src="${esc(base)}/img/logo-rosa-mail.png" alt="Moda con Steph" width="190" style="display:block;width:190px;max-width:100%;height:auto;border:0"></a></td></tr>
${h1}
<tr><td class="pad" style="padding:6px 36px 10px">${cuerpo}</td></tr>
<tr><td class="pad" style="padding:8px 36px 0"><p style="margin:0;border-top:1px solid ${LINEA};padding-top:18px;font-size:12px;line-height:1.5;color:${SUAVE}">Moda con Steph · Estudio de maquillaje e imagen · Belgrano, CABA</p></td></tr>
</table></td></tr></table></body></html>`;
}
