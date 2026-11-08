import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { getCurso } from '@/lib/catalogo';
import { PALETAS, conAlfa, propsCaratula, tamanoTitulo } from '@/lib/caratula';
import { ilustracionSvg } from '@/lib/caratula-svg';

/*
 * La imagen que aparece cuando se comparte el link de un curso (WhatsApp, Instagram, etc.): su misma carátula.
 * La dirección lleva una huella de la carátula (?v=…): si Steph la cambia, la dirección cambia y nadie ve la vieja.
 * Por eso puede guardarse "para siempre" en cualquier caché.
 */

const size = { width: 1200, height: 630 };

const fuente = (archivo: string) => readFile(path.join(process.cwd(), 'src', 'assets', 'fonts', archivo));

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const curso = await getCurso(slug);
  if (!curso) return new Response('No existe ese curso', { status: 404 });

  const [titulos, cuerpo] = await Promise.all([
    fuente('poppins-700.woff'),
    fuente('poppins-500.woff'),
  ]);

  const c = propsCaratula(curso);
  const P = PALETAS[c.paleta] ?? PALETAS.ciruela;
  const dibujo = `data:image/svg+xml;base64,${Buffer.from(ilustracionSvg(c.motivo, c.paleta)).toString('base64')}`;
  const luz = { width: 25, height: 25, borderRadius: 25, background: P.chispa, boxShadow: `0 0 16px 6px ${conAlfa(P.chispa, 0.7)}` };

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: 'flex', position: 'relative', fontFamily: 'Poppins', color: P.tinta, background: `radial-gradient(circle at 1010px 30px, ${P.fondo2} 0px, ${P.fondo} 760px)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dibujo} width={840} height={630} alt="" style={{ position: 'absolute', left: 360, top: 0 }} />
        <div style={{ position: 'absolute', left: 25, top: 25, width: 1150, height: 580, borderRadius: 38, border: `2px solid ${P.linea}` }} />
        <div style={{ position: 'absolute', left: 64, top: 58, display: 'flex', alignItems: 'center', fontSize: 23, letterSpacing: 4.2, textTransform: 'uppercase', color: P.tinta2 }}>
          <div style={{ ...luz, width: 22, height: 22, marginRight: 16 }} />
          Moda con Steph
        </div>
        <div style={{ position: 'absolute', left: 64, bottom: 64, width: 660, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: Math.round(tamanoTitulo(c.titulo, 76) * 8.4), lineHeight: 1.04, letterSpacing: -2, color: P.tinta }}>{c.titulo}</div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 26, fontSize: 28, color: P.tinta2 }}>
            {Array.from({ length: c.luces }, (_, i) => <div key={i} style={{ ...luz, marginRight: 11 }} />)}
            <span style={{ marginLeft: c.luces ? 9 : 0 }}>{c.detalle}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
      fonts: [
        { name: 'Poppins', data: titulos, weight: 700, style: 'normal' },
        { name: 'Poppins', data: cuerpo, weight: 500, style: 'normal' },
      ],
    },
  );
}
