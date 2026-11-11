import type { Motivo, PaletaDef } from '@/lib/caratula';
import { mezcla } from '@/lib/caratula';

/*
 * Ilustraciones de las carátulas, estilo "escenario" (elegido el 2026-11-11): un objeto con volumen, grande y centrado,
 * sobre un haz de luz y con su sombra de apoyo. Todo queda adentro de la hoja de 400 x 300, con aire alrededor.
 * Los colores salen siempre de la paleta (fondo, figura y detalle): no hay ningún color suelto salvo el metal y los brillos.
 * Se usa en la web, en el panel y en la imagen para compartir (que se dibuja en el servidor: por eso todo son elementos SVG simples).
 */

export type Colores = { fondo: string; fig: string; det: string };
type Obj = { w: number; h: number; cy: number; g: React.JSX.Element };

const lt = (c: string, t = 0.38) => mezcla(c, '#FFFFFF', t);
const dk = (c: string, t = 0.3) => mezcla(c, '#000000', t);

export function coloresEscena(P: PaletaDef): Colores {
  return { fondo: P.fondo, fig: P.figura, det: P.detalle };
}

function Lin({ id, c1, c2, x2 = 0, y2 = 1, mid }: { id: string; c1: string; c2: string; x2?: number; y2?: number; mid?: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      <stop offset="0" stopColor={c1} />
      {mid && <stop offset=".5" stopColor={mid} />}
      <stop offset="1" stopColor={c2} />
    </linearGradient>
  );
}
function Rad({ id, c1, c2, cx = 0.35, cy = 0.3, r = 0.8 }: { id: string; c1: string; c2: string; cx?: number; cy?: number; r?: number }) {
  return (
    <radialGradient id={id} cx={cx} cy={cy} r={r}>
      <stop offset="0" stopColor={c1} />
      <stop offset="1" stopColor={c2} />
    </radialGradient>
  );
}
function Chispa({ x, y, s, c, o = 0.9 }: { x: number; y: number; s: number; c: string; o?: number }) {
  return (
    <path
      d={`M${x} ${y - s}L${x + s * 0.25} ${y - s * 0.25}L${x + s} ${y}L${x + s * 0.25} ${y + s * 0.25}L${x} ${y + s}L${x - s * 0.25} ${y + s * 0.25}L${x - s} ${y}L${x - s * 0.25} ${y - s * 0.25}Z`}
      fill={c}
      opacity={o}
    />
  );
}

/** Puntos repartidos a distancia pareja sobre el borde de un rectángulo redondeado. */
function anillo(x: number, y: number, w: number, h: number, r: number, paso: number): [number, number][] {
  const rectoH = w - 2 * r, rectoV = h - 2 * r, arco = (Math.PI * r) / 2;
  const tramos: { largo: number; en: (s: number) => [number, number] }[] = [
    { largo: rectoH, en: (s) => [x + r + s, y] },
    { largo: arco, en: (s) => [x + w - r + r * Math.cos(-Math.PI / 2 + s / r), y + r + r * Math.sin(-Math.PI / 2 + s / r)] },
    { largo: rectoV, en: (s) => [x + w, y + r + s] },
    { largo: arco, en: (s) => [x + w - r + r * Math.cos(s / r), y + h - r + r * Math.sin(s / r)] },
    { largo: rectoH, en: (s) => [x + w - r - s, y + h] },
    { largo: arco, en: (s) => [x + r + r * Math.cos(Math.PI / 2 + s / r), y + h - r + r * Math.sin(Math.PI / 2 + s / r)] },
    { largo: rectoV, en: (s) => [x, y + h - r - s] },
    { largo: arco, en: (s) => [x + r + r * Math.cos(Math.PI + s / r), y + r + r * Math.sin(Math.PI + s / r)] },
  ];
  const total = tramos.reduce((a, t) => a + t.largo, 0);
  const n = Math.max(4, Math.round(total / paso));
  return Array.from({ length: n }, (_, k) => {
    let s = (k * total) / n;
    for (const t of tramos) {
      if (s <= t.largo) return t.en(s);
      s -= t.largo;
    }
    return tramos[0].en(0);
  });
}

/* ------------------------------------------------------------------ los objetos, dibujados alrededor del (0, 0) */

function abanico(u: string, C: Colores): Obj {
  const tonos = [0, 1, 2, 3, 4, 5, 6].map((i) => mezcla(C.fig, C.fondo, ((6 - i) / 6) * 0.6));
  return {
    w: 290, h: 190, cy: -8,
    g: (
      <g>
        <defs>
          {tonos.map((c, i) => <Lin key={i} id={`${u}lf${i}`} c1={lt(c, 0.3)} c2={dk(c, 0.2)} />)}
          <Rad id={`${u}rv`} c1="#FFFFFF" c2="#767676" />
        </defs>
        {[-60, -40, -20, 0, 20, 40, 60].map((a, i) => (
          <g key={a} transform={`translate(0 84) rotate(${a})`} filter={`url(#${u}sh)`}>
            <path d="M-21 0V-168a21 21 0 0 1 42 0V0Z" fill={`url(#${u}lf${i})`} />
            <path d="M-21 -146V-168a21 21 0 0 1 42 0V-146Z" fill="#FFFFFF" opacity={0.18} />
            <rect x={-12} y={-142} width={24} height={32} rx={3} fill="#FFFFFF" opacity={0.55} />
            <circle cx={0} cy={-156} r={4.4} fill={C.fondo} />
            <path d="M-21 -168V0" stroke="#FFFFFF" strokeOpacity={0.35} />
          </g>
        ))}
        <circle cx={0} cy={84} r={14} fill={`url(#${u}rv)`} filter={`url(#${u}sh)`} />
        <circle cx={-4} cy={80} r={4} fill="#FFFFFF" opacity={0.9} />
      </g>
    ),
  };
}

function circulo(u: string, C: Colores): Obj {
  const n = 12, R = 96;
  return {
    w: 202, h: 202, cy: 0,
    g: (
      <g>
        <defs><Rad id={`${u}rv`} c1="#FFFFFF" c2="#767676" /></defs>
        <g filter={`url(#${u}sh)`}>
          <circle r={R + 5} fill={lt(C.fondo, 0.5)} />
          {Array.from({ length: n }, (_, i) => {
            const a0 = ((i * 30 - 90) * Math.PI) / 180, a1 = (((i + 1) * 30 - 90) * Math.PI) / 180, am = (a0 + a1) / 2;
            const c = mezcla(dk(C.det, 0.05), lt(C.fig, 0.5), i / (n - 1));
            return (
              <g key={i}>
                <path d={`M0 0L${(R * Math.cos(a0)).toFixed(1)} ${(R * Math.sin(a0)).toFixed(1)}A${R} ${R} 0 0 1 ${(R * Math.cos(a1)).toFixed(1)} ${(R * Math.sin(a1)).toFixed(1)}Z`} fill={c} stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={1.6} />
                <circle cx={(Math.cos(am) * 70).toFixed(1)} cy={(Math.sin(am) * 70).toFixed(1)} r={4.2} fill="#FFFFFF" opacity={0.7} />
              </g>
            );
          })}
        </g>
        <circle r={30} fill={lt(C.fondo, 0.55)} />
        <circle r={30} fill="none" stroke="#FFFFFF" strokeOpacity={0.7} />
        <circle r={12} fill={`url(#${u}rv)`} />
        <circle cx={-3} cy={-4} r={3.4} fill="#FFFFFF" />
        <path d="M-82 -48A96 96 0 0 1 -30 -88" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={5} strokeLinecap="round" fill="none" />
      </g>
    ),
  };
}

function espejo(u: string, C: Colores): Obj {
  return {
    w: 140, h: 222, cy: -2,
    g: (
      <g>
        <defs>
          <Lin id={`${u}fr`} c1={lt(C.fig, 0.45)} c2={dk(C.fig, 0.35)} x2={1} y2={1} />
          <Lin id={`${u}gv`} c1={mezcla(C.fondo, '#FFFFFF', 0.7)} c2={mezcla(C.fondo, C.fig, 0.25)} x2={1} y2={1} />
          <Lin id={`${u}nk`} c1="#8A8A8A" c2="#8A8A8A" x2={1} y2={0} mid="#F2F2F2" />
          <Rad id={`${u}bu`} c1="#FFFFFF" c2={C.det} cx={0.4} cy={0.35} r={0.75} />
        </defs>
        <ellipse cx={0} cy={108} rx={52} ry={8} fill="#000000" opacity={0.22} filter={`url(#${u}gl)`} />
        <rect x={-7} y={78} width={14} height={24} fill={`url(#${u}nk)`} />
        <rect x={-34} y={98} width={68} height={9} rx={4.5} fill={`url(#${u}fr)`} filter={`url(#${u}sh)`} />
        <rect x={-70} y={-104} width={140} height={186} rx={28} fill={`url(#${u}fr)`} filter={`url(#${u}sh)`} />
        <rect x={-70} y={-104} width={140} height={186} rx={28} fill="none" stroke="#FFFFFF" strokeOpacity={0.4} />
        <rect x={-52} y={-86} width={104} height={150} rx={15} fill={`url(#${u}gv)`} />
        <path d="M-48 40L26 -82H50L-48 62Z" fill="#FFFFFF" opacity={0.42} />
        <path d="M24 64L52 24V64Z" fill="#FFFFFF" opacity={0.28} />
        {anillo(-61, -95, 122, 168, 19, 22).map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={9} fill={C.det} opacity={0.5} filter={`url(#${u}gl)`} />
            <circle cx={x} cy={y} r={5.2} fill={`url(#${u}bu)`} />
          </g>
        ))}
      </g>
    ),
  };
}

/** Paleta de sombras, labial y pincel. */
function labial(u: string, C: Colores): Obj {
  const d = dk(C.det, 0.1);
  const pans = [lt(C.fig, 0.3), C.fig, dk(C.fig, 0.15), mezcla(C.fondo, C.fig, 0.55), lt(C.fondo, 0.4), mezcla(C.det, C.fig, 0.5)];
  return {
    w: 210, h: 196, cy: -2,
    g: (
      <g>
        <defs>
          <Lin id={`${u}cb`} c1={lt(d, 0.25)} c2={dk(d, 0.35)} x2={1} y2={1} />
          <Lin id={`${u}lp`} c1={dk(d, 0.3)} c2={dk(d, 0.3)} x2={1} y2={0} mid={lt(d, 0.5)} />
          <Lin id={`${u}mt`} c1="#8A8A8A" c2="#8A8A8A" x2={1} y2={0} mid="#F4F4F4" />
          <Lin id={`${u}bt`} c1={lt(C.fig, 0.3)} c2={dk(C.fig, 0.25)} />
          <Lin id={`${u}hd`} c1={dk(d, 0.2)} c2={lt(d, 0.35)} x2={1} y2={0} />
          <Lin id={`${u}br`} c1={lt(C.fondo, 0.4)} c2={C.fig} x2={1} y2={0} />
          {pans.map((c, i) => <Rad key={i} id={`${u}pn${i}`} c1={lt(c, 0.35)} c2={dk(c, 0.18)} cx={0.38} cy={0.32} r={0.85} />)}
        </defs>
        <g transform="translate(-16 -22) rotate(-9)" filter={`url(#${u}sh)`}>
          <rect x={-72} y={-54} width={144} height={108} rx={13} fill={`url(#${u}cb)`} />
          <rect x={-72} y={-54} width={144} height={108} rx={13} fill="none" stroke="#FFFFFF" strokeOpacity={0.3} />
          {pans.map((c, i) => {
            const cx = -42 + (i % 3) * 42, cy = -24 + Math.floor(i / 3) * 48;
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={18} fill={dk(d, 0.4)} />
                <circle cx={cx} cy={cy} r={15.5} fill={`url(#${u}pn${i})`} />
                <circle cx={cx - 5} cy={cy - 6} r={4} fill="#FFFFFF" opacity={0.3} />
              </g>
            );
          })}
          {[[-48, -30], [-40, -34], [-36, -26], [40, -30], [-6, 18], [2, 24]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.2} fill="#FFFFFF" />)}
        </g>
        <g transform="translate(86 12) rotate(18)" filter={`url(#${u}sh)`}>
          <rect x={-13} y={0} width={26} height={76} rx={4} fill={`url(#${u}lp)`} />
          <rect x={-13} y={-11} width={26} height={14} rx={2} fill={`url(#${u}mt)`} />
          <path d="M-10 -11V-44Q-10 -52 -2 -56L10 -62V-11Z" fill={`url(#${u}bt)`} />
          <path d="M-6 -13V-42" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={2} />
        </g>
        <g transform="translate(-10 84) rotate(-6)" filter={`url(#${u}sh)`}>
          <rect x={-70} y={-3.5} width={76} height={7} rx={3.5} fill={`url(#${u}hd)`} />
          <rect x={6} y={-6.5} width={26} height={13} fill={`url(#${u}mt)`} />
          <path d="M32 -6.5C54 -13 72 -7 80 0C72 7 54 13 32 6.5Z" fill={`url(#${u}br)`} />
        </g>
      </g>
    ),
  };
}

function perchero(u: string, C: Colores): Obj {
  const prendas = [
    { x: -54, l: 108, w: 27, c: lt(C.fig, 0.25) },
    { x: 0, l: 136, w: 31, c: C.fig },
    { x: 54, l: 114, w: 28, c: dk(C.fig, 0.28) },
  ];
  return {
    w: 200, h: 216, cy: 0,
    g: (
      <g>
        <defs>
          <Lin id={`${u}rl`} c1="#9B9B9B" c2="#9B9B9B" mid="#FAFAFA" />
          {prendas.map((o, i) => <Lin key={i} id={`${u}gm${i}`} c1={lt(o.c, 0.22)} c2={dk(o.c, 0.22)} x2={1} y2={1} />)}
        </defs>
        <path d="M-88 -100V-80M88 -100V-80" stroke="#9B9B9B" strokeWidth={3} />
        <circle cx={-88} cy={-101} r={4} fill="#BDBDBD" />
        <circle cx={88} cy={-101} r={4} fill="#BDBDBD" />
        <rect x={-100} y={-82} width={200} height={8} rx={4} fill={`url(#${u}rl)`} filter={`url(#${u}sh)`} />
        {prendas.map((o, i) => {
          const x = o.x, y = -72;
          return (
            <g key={i}>
              <g filter={`url(#${u}sh)`}>
                <path d={`M${x} ${y}V${y + 16}`} stroke={C.det} strokeWidth={3} strokeLinecap="round" />
                <path d={`M${x - o.w} ${y + 44}L${x} ${y + 20}L${x + o.w} ${y + 44}`} fill="none" stroke={C.det} strokeWidth={3} strokeLinejoin="round" />
                <path d={`M${x - o.w + 3} ${y + 44}L${x - o.w - 10} ${y + o.l}Q${x} ${y + o.l + 16} ${x + o.w + 10} ${y + o.l}L${x + o.w - 3} ${y + 44}Z`} fill={`url(#${u}gm${i})`} />
              </g>
              {[-0.55, -0.15, 0.3, 0.62].map((f) => (
                <path key={f} d={`M${x + f * o.w} ${y + 50}Q${x + f * o.w * 1.25} ${y + o.l * 0.6} ${x + f * (o.w + 9)} ${y + o.l + 6}`} stroke={f > 0 ? '#FFFFFF' : '#000000'} strokeOpacity={f > 0 ? 0.22 : 0.16} strokeWidth={3} fill="none" strokeLinecap="round" />
              ))}
              <path d={`M${x - 9} ${y + 44}L${x} ${y + 60}L${x + 9} ${y + 44}Z`} fill={C.fondo} opacity={0.85} />
            </g>
          );
        })}
      </g>
    ),
  };
}

function arcos(u: string, C: Colores): Obj {
  const arco = (r: number) => `M${-r} 78V-12A${r} ${r} 0 0 1 ${r} -12V78Z`;
  const radios = [92, 70, 48, 27];
  return {
    w: 190, h: 190, cy: 4,
    g: (
      <g>
        <defs>
          {radios.map((r, i) => {
            const c = [C.fig, lt(C.fig, 0.5), mezcla(C.fig, C.fondo, 0.2), lt(C.fig, 0.68)][i];
            return <Lin key={r} id={`${u}ar${i}`} c1={lt(c, 0.25)} c2={dk(c, 0.18)} />;
          })}
        </defs>
        <rect x={-100} y={76} width={200} height={9} rx={4.5} fill={lt(C.fondo, 0.4)} filter={`url(#${u}sh)`} />
        {radios.map((r, i) => <path key={r} d={arco(r)} fill={`url(#${u}ar${i})`} filter={`url(#${u}sh)`} />)}
        <path d="M-70 40V-8" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={3} strokeLinecap="round" />
        <circle cx={0} cy={36} r={6} fill={C.det} />
      </g>
    ),
  };
}

function regalo(u: string, C: Colores): Obj {
  return {
    w: 150, h: 156, cy: -4,
    g: (
      <g>
        <defs>
          <Lin id={`${u}cj`} c1={lt(C.fig, 0.2)} c2={dk(C.fig, 0.28)} x2={1} y2={1} />
          <Lin id={`${u}tp`} c1={lt(C.fig, 0.4)} c2={C.fig} x2={1} y2={1} />
          <Lin id={`${u}mo`} c1={lt(C.det, 0.35)} c2={dk(C.det, 0.2)} x2={1} y2={1} />
        </defs>
        <g filter={`url(#${u}sh)`}>
          <rect x={-62} y={-8} width={124} height={92} rx={8} fill={`url(#${u}cj)`} />
          <rect x={-70} y={-34} width={140} height={30} rx={7} fill={`url(#${u}tp)`} />
          <rect x={-11} y={-34} width={22} height={118} fill={`url(#${u}mo)`} />
          <g transform="rotate(-26 0 -46)"><ellipse cx={-24} cy={-52} rx={27} ry={14} fill={`url(#${u}mo)`} /></g>
          <g transform="rotate(26 0 -46)"><ellipse cx={24} cy={-52} rx={27} ry={14} fill={`url(#${u}mo)`} /></g>
          <circle cx={0} cy={-46} r={10} fill={dk(C.det, 0.12)} />
        </g>
        <path d="M-56 -2V70" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={4} strokeLinecap="round" />
      </g>
    ),
  };
}

const OBJETOS: Record<Motivo, (u: string, C: Colores) => Obj> = {
  abanico, mezcla: circulo, espejo, arco: arcos, perchero, labial, regalo,
};

/**
 * La escena completa (400 x 300). `tarjeta`: con fondo y haz de luz, para la web y el panel.
 * `compartir`: sin fondo y con el objeto a la derecha, porque a la izquierda va el título en la imagen para redes.
 */
export function Escena({ uid, motivo, C, modo = 'tarjeta' }: { uid: string; motivo: Motivo; C: Colores; modo?: 'tarjeta' | 'compartir' }) {
  const o = (OBJETOS[motivo] ?? abanico)(uid, C);
  const compartir = modo === 'compartir';
  const fit = compartir ? { w: 214, h: 244 } : { w: 250, h: 210 };
  const s = Math.min(fit.w / o.w, fit.h / o.h);
  const cx = compartir ? 256 : 200, cy = compartir ? 152 : 146;
  return (
    <g>
      <defs>
        <filter id={`${uid}sh`} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.28" /></filter>
        <filter id={`${uid}gl`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" /></filter>
        <filter id={`${uid}bl`}><feGaussianBlur stdDeviation="2.2" /></filter>
        <Lin id={`${uid}bg`} c1={lt(C.fondo, 0.25)} c2={C.fondo} />
        <radialGradient id={`${uid}sp`}><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.75" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></radialGradient>
      </defs>
      {!compartir && (
        <>
          <rect width="400" height="300" fill={`url(#${uid}bg)`} />
          <ellipse cx="200" cy="150" rx="176" ry="124" fill={`url(#${uid}sp)`} />
        </>
      )}
      <ellipse cx={cx} cy={cy + (o.h * s) / 2 + 4} rx={o.w * s * 0.42} ry="9" fill="#000000" opacity={0.14} filter={`url(#${uid}bl)`} />
      <g transform={`translate(${cx} ${(cy + o.cy * s).toFixed(1)}) scale(${s.toFixed(3)})`}>{o.g}</g>
      <Chispa x={compartir ? 150 : 62} y={compartir ? 36 : 60} s={8} c={C.det} o={0.55} />
      <Chispa x={compartir ? 380 : 342} y={compartir ? 256 : 236} s={6} c={C.det} o={0.45} />
    </g>
  );
}
