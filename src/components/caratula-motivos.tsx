import type { Motivo, PaletaDef } from '@/lib/caratula';

/*
 * Ilustraciones de las carátulas. Todas se dibujan en una hoja de 400 x 300, pensadas para ocupar la mitad
 * derecha (y sangrar por arriba y por la derecha) y dejar libre abajo a la izquierda, donde va el título.
 * Los colores salen siempre de la paleta: no hay ningún color suelto.
 */

type P = { P: PaletaDef; uid: string };

function Chispa({ x, y, s = 9, c }: { x: number; y: number; s?: number; c: string }) {
  return <path d={`M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`} fill={c} />;
}

function Bombita({ x, y, r = 6.4, P }: { x: number; y: number; r?: number; P: PaletaDef }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * 2} fill={P.bombita} opacity={0.32} />
      <circle cx={x} cy={y} r={r * 1.35} fill={P.bombita} opacity={0.4} />
      <circle cx={x} cy={y} r={r} fill={P.bombita} />
      <circle cx={x - r * 0.3} cy={y - r * 0.35} r={r * 0.38} fill={P.reflejo} />
    </g>
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

function Abanico({ P }: P) {
  const px = 346, py = 220, L = 152, ancho = 42;
  const angulos = [-62, -46, -30, -14, 2, 18, 34];
  return (
    <g>
      {angulos.map((a, i) => (
        <g key={a} transform={`rotate(${a} ${px} ${py})`}>
          <rect x={px - ancho / 2} y={py - L} width={ancho} height={L} rx={ancho / 2} fill={P.rampa[i]} />
          <circle cx={px} cy={py - L + 21} r={5.5} fill={P.fondo} opacity={0.5} />
        </g>
      ))}
      <circle cx={px} cy={py} r={14} fill={P.tinta} />
      <circle cx={px} cy={py} r={5} fill={P.fondo} />
      <Chispa x={236} y={52} s={11} c={P.chispa} />
      <Chispa x={372} y={30} s={7} c={P.chispa} />
    </g>
  );
}

function Mezcla({ P, uid }: P) {
  const r = 68;
  const A = { x: 344, y: 78 }, B = { x: 390, y: 156 }, C = { x: 300, y: 156 };
  const a = `${uid}a`, b = `${uid}b`, c = `${uid}c`;
  return (
    <g>
      <defs>
        <clipPath id={a}><circle cx={A.x} cy={A.y} r={r} /></clipPath>
        <clipPath id={b}><circle cx={B.x} cy={B.y} r={r} /></clipPath>
        <clipPath id={c}><circle cx={C.x} cy={C.y} r={r} /></clipPath>
      </defs>
      <circle cx={A.x} cy={A.y} r={r} fill={P.rampa[1]} />
      <circle cx={B.x} cy={B.y} r={r} fill={P.rampa[3]} />
      <circle cx={C.x} cy={C.y} r={r} fill={P.rampa[5]} />
      <g clipPath={`url(#${a})`}><circle cx={B.x} cy={B.y} r={r} fill={P.rampa[2]} /></g>
      <g clipPath={`url(#${b})`}><circle cx={C.x} cy={C.y} r={r} fill={P.rampa[4]} /></g>
      <g clipPath={`url(#${c})`}><circle cx={A.x} cy={A.y} r={r} fill={P.rampa[0]} /></g>
      <g clipPath={`url(#${a})`}><g clipPath={`url(#${b})`}><circle cx={C.x} cy={C.y} r={r} fill={P.centro} /></g></g>
      <Chispa x={252} y={40} s={10} c={P.chispa} />
    </g>
  );
}

function Espejo({ P, uid }: P) {
  const x = 236, y = 24, w = 140, h = 184, r = 28;
  const gx = x + 18, gy = y + 18, gw = w - 36, gh = h - 36;
  const bombitas = anillo(x + 9, y + 9, w - 18, h - 18, r - 9, 33);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.reflejo} stopOpacity="0.9" />
          <stop offset="1" stopColor={P.vidrio} />
        </linearGradient>
        <clipPath id={`${uid}v`}><rect x={gx} y={gy} width={gw} height={gh} rx={12} /></clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={r} fill={P.marco} />
      <rect x={gx} y={gy} width={gw} height={gh} rx={12} fill={P.vidrio} />
      <rect x={gx} y={gy} width={gw} height={gh} rx={12} fill={`url(#${uid}g)`} opacity={0.75} />
      <g clipPath={`url(#${uid}v)`}>
        <path d={`M${gx - 4} ${gy + 74}L${gx + 70} ${gy - 4}H${gx + 104}L${gx - 4} ${gy + 128}Z`} fill={P.reflejo} opacity={0.55} />
        <path d={`M${gx + gw - 18} ${gy + gh + 4}L${gx + gw + 4} ${gy + gh - 40}V${gy + gh + 4}Z`} fill={P.reflejo} opacity={0.45} />
      </g>
      <Chispa x={gx + gw - 30} y={gy + 38} s={13} c={P.reflejo} />
      {bombitas.map(([bx, by], i) => <Bombita key={i} x={bx} y={by} r={6} P={P} />)}
    </g>
  );
}

function Arcos({ P }: P) {
  const cx = 330, cy = 158, base = 320;
  const radios = [96, 74, 53, 33, 14];
  return (
    <g>
      {radios.map((r, i) => (
        <path key={r} d={`M${cx - r} ${base}V${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}V${base}Z`} fill={P.rampa[i + 1]} />
      ))}
      <Chispa x={236} y={92} s={10} c={P.chispa} />
      <Chispa x={382} y={34} s={7} c={P.chispa} />
    </g>
  );
}

function Perchero({ P }: P) {
  const y0 = 44;
  const prendas = [
    { x: 238, largo: 104, ancho: 30, c: 2 },
    { x: 292, largo: 168, ancho: 34, c: 4 },
    { x: 346, largo: 128, ancho: 31, c: 1 },
    { x: 398, largo: 190, ancho: 34, c: 5 },
  ];
  return (
    <g>
      <rect x={196} y={y0 - 2} width={216} height={5} rx={2.5} fill={P.tinta} />
      {prendas.map(({ x, largo, ancho, c }) => (
        <g key={x}>
          <path d={`M${x} ${y0 + 3}V${y0 + 16}`} stroke={P.tinta} strokeWidth={3} strokeLinecap="round" fill="none" />
          <path d={`M${x - ancho} ${y0 + 42}L${x} ${y0 + 18}L${x + ancho} ${y0 + 42}Z`} stroke={P.tinta} strokeWidth={3} strokeLinejoin="round" fill="none" />
          <path
            d={`M${x - ancho + 2} ${y0 + 42}L${x - ancho - 8} ${y0 + largo}Q${x} ${y0 + largo + 12} ${x + ancho + 8} ${y0 + largo}L${x + ancho - 2} ${y0 + 42}Z`}
            fill={P.rampa[c]}
          />
          <path d={`M${x - 9} ${y0 + 42}L${x} ${y0 + 58}L${x + 9} ${y0 + 42}Z`} fill={P.fondo} opacity={0.85} />
        </g>
      ))}
      <Chispa x={220} y={150} s={9} c={P.chispa} />
    </g>
  );
}

function Labial({ P }: P) {
  return (
    <g>
      <path d="M214 204Q252 182 290 194" stroke={P.rampa[2]} strokeWidth={22} strokeLinecap="round" fill="none" />
      <path d="M224 236Q262 214 302 228" stroke={P.rampa[4]} strokeWidth={22} strokeLinecap="round" fill="none" />
      <path d="M244 168Q280 148 314 160" stroke={P.rampa[1]} strokeWidth={22} strokeLinecap="round" fill="none" />
      <g transform="translate(-22 0) rotate(14 336 170)">
        <rect x={306} y={122} width={62} height={146} rx={10} fill={P.marco} />
        <rect x={306} y={104} width={62} height={22} rx={5} fill={P.acento} />
        <path d="M312 104V60Q312 44 328 38L364 22V104Z" fill={P.rampa[4]} />
        <path d="M316 104V62Q316 52 326 48" stroke={P.reflejo} strokeOpacity={0.45} strokeWidth={4} strokeLinecap="round" fill="none" />
        <rect x={316} y={138} width={8} height={110} rx={4} fill={P.reflejo} opacity={0.28} />
      </g>
      <Chispa x={248} y={52} s={10} c={P.chispa} />
      <Chispa x={392} y={206} s={7} c={P.chispa} />
    </g>
  );
}

function Regalo({ P }: P) {
  return (
    <g>
      <rect x={262} y={124} width={124} height={110} rx={12} fill={P.rampa[3]} />
      <rect x={252} y={96} width={144} height={38} rx={10} fill={P.rampa[2]} />
      <rect x={313} y={96} width={22} height={138} fill={P.acento} />
      <rect x={313} y={96} width={22} height={38} fill={P.acento} />
      <g transform="rotate(-28 324 88)"><ellipse cx={294} cy={86} rx={30} ry={15} fill={P.acento} /></g>
      <g transform="rotate(28 324 88)"><ellipse cx={354} cy={86} rx={30} ry={15} fill={P.acento} /></g>
      <circle cx={324} cy={92} r={11} fill={P.rampa[4]} />
      <Chispa x={236} y={70} s={11} c={P.chispa} />
      <Chispa x={390} y={40} s={8} c={P.chispa} />
      <Chispa x={266} y={30} s={6} c={P.chispa} />
    </g>
  );
}

const DIBUJOS: Record<Motivo, (p: P) => React.JSX.Element> = {
  abanico: Abanico, mezcla: Mezcla, espejo: Espejo, arco: Arcos, perchero: Perchero, labial: Labial, regalo: Regalo,
};

export function Ilustracion({ motivo, P, uid }: { motivo: Motivo } & P) {
  const Dibujo = DIBUJOS[motivo] ?? Abanico;
  return <Dibujo P={P} uid={uid} />;
}
