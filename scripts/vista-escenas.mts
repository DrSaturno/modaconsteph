/* Vista rápida de las carátulas nuevas (no forma parte de la web): node scripts/vista-escenas.mts  →  escribe .data/vista-escenas.html */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { createElement as h } from 'react';
import { Escena, coloresEscena } from '../src/components/caratula-objetos';
import { ilustracionSvg } from '../src/lib/caratula-svg';
import { PALETAS, type Motivo, type Paleta } from '../src/lib/caratula';

const cursos: { nom: string; motivo: Motivo; paleta: Paleta }[] = [
  { nom: 'Taller de automaquillaje y colorimetría', motivo: 'abanico', paleta: 'taller' as Paleta },
  { nom: 'Sesión de automaquillaje', motivo: 'espejo', paleta: 'espejo' as Paleta },
  { nom: 'Automaquillaje, estilismo y colorimetría', motivo: 'labial', paleta: 'arcos' as Paleta },
  { nom: 'Asesoría de imagen integral', motivo: 'perchero', paleta: 'perchero' as Paleta },
  { nom: 'Intensivo de Verano', motivo: 'mezcla', paleta: 'abanico' as Paleta },
  { nom: '(Arcos, paleta Noche)', motivo: 'arco', paleta: 'ciruela' },
  { nom: '(Regalo, paleta Rosa)', motivo: 'regalo', paleta: 'berry' },
];
const css = readFileSync('src/components/caratula.css', 'utf8');
const tarjeta = (c: { motivo: Motivo; paleta: Paleta }, i: number) =>
  renderToStaticMarkup(h('div', { className: 'cv' }, h('svg', { className: 'cv-art', viewBox: '0 0 400 300', preserveAspectRatio: 'xMidYMid slice' }, h(Escena, { uid: `t${i}`, motivo: c.motivo, C: coloresEscena(PALETAS[c.paleta]) }))));
const celdas = cursos.map((c, i) => `<div class="c">${tarjeta(c, i)}<div class="n">${c.nom}</div></div>`).join('');
const compartir = cursos.slice(0, 5).map((c) => {
  const P = PALETAS[c.paleta];
  const svg = ilustracionSvg(c.motivo, c.paleta);
  return `<div class="s" style="background:radial-gradient(circle at 84% 5%,${P.fondo2} 0,${P.fondo} 63%);color:${P.tinta}"><div class="sv">${svg}</div><b>${c.nom}</b></div>`;
}).join('');
mkdirSync('.data', { recursive: true });
writeFileSync('.data/vista-escenas.html', `<!doctype html><meta charset=utf-8><style>${css}
body{margin:0;padding:24px;font-family:Poppins,system-ui,sans-serif;background:#f4f2f1;width:1300px}
.g{display:grid;grid-template-columns:repeat(4,300px);gap:16px;margin-bottom:28px}.c{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 0 0 1px #e3e0de}.n{padding:8px 12px;font-size:12px;font-weight:600}
.s{position:relative;width:600px;height:315px;border-radius:12px;overflow:hidden;margin:0 16px 16px 0;display:inline-block}.sv{position:absolute;left:180px;top:0;width:420px;height:315px}.sv svg{width:100%;height:100%}.s b{position:absolute;left:30px;bottom:30px;font-size:26px;width:300px;line-height:1.05}</style>
<div class="g">${celdas}</div><h3>Imagen para compartir (maqueta)</h3>${compartir}`);
console.log('listo');
