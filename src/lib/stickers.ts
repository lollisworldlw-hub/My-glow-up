// Gym Girl sticker set: an original chibi character (pink sweatband + ponytail) in a chunky,
// shaded sticker style. Every sticker is drawn as SVG so it stays crisp and tiny.
const O = '#2B1D16'; // outline
const W = (n = 3.5) => `stroke="${O}" stroke-width="${n}" stroke-linecap="round" stroke-linejoin="round"`;

type Skin = 'normal' | 'red' | 'soot' | 'sun' | 'green' | 'pale';
interface Face { skin?: Skin; eyes: string; mouth: string; extras?: string[]; turned?: boolean }

const SKIN: Record<Skin, [string, string, string]> = {
  normal: ['#FFE3CC', '#F6C29C', '#E8A47C'],
  red: ['#FFB3A0', '#F2785F', '#D9503A'],
  soot: ['#6B6158', '#3E3631', '#2A2420'],
  sun: ['#FFC48A', '#F4914A', '#D8702E'],
  green: ['#D9EFC2', '#B3D99A', '#8DBF72'],
  pale: ['#E4E6F2', '#C9CBE0', '#A9ACC8']
};

function defs(id: string, skin: Skin) {
  const [a, b, c] = SKIN[skin];
  return `<defs>
<radialGradient id="${id}s" cx="45%" cy="38%" r="68%"><stop offset="0%" stop-color="${a}"/><stop offset="72%" stop-color="${b}"/><stop offset="100%" stop-color="${c}"/></radialGradient>
<linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8A5A3C"/><stop offset="100%" stop-color="#5A3622"/></linearGradient>
<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FF9EC0"/><stop offset="100%" stop-color="#E5578B"/></linearGradient>
</defs>`;
}

function head(id: string, turned = false) {
  if (turned) return `
<path d="M10 46 C2 52 4 70 14 74 C16 64 18 56 22 50Z" fill="url(#${id}h)" ${W(3)}/>
<path d="M18 56 C16 32 32 16 52 16 C72 16 86 30 86 50 C88 56 90 60 87 63 C85 65 84 66 84 68 C84 80 72 90 54 90 C34 90 20 78 18 56Z" fill="url(#${id}s)" ${W()}/>
<path d="M16 52 C14 28 32 12 52 12 C66 12 78 18 84 30 C70 30 58 34 50 42 C46 50 44 58 36 64 C28 66 20 62 16 52Z" fill="url(#${id}h)" ${W()}/>
<path d="M17 44 C28 30 48 24 64 26 C72 27 79 30 84 34 L84 42 C78 38 70 35 62 35 C46 35 30 42 19 53Z" fill="url(#${id}b)" ${W(3)}/>
<path d="M30 36 C40 30 50 28 60 29" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".55" fill="none"/>
<path d="M62 56 Q69 61 76 56" fill="none" ${W(3.2)}/>
<path d="M60 51 L74 49" ${W(2.6)}/>
<ellipse cx="68" cy="68" rx="7" ry="4" fill="#FF6F86" opacity=".7"/>
<path d="M72 79 Q77 77 80 79" fill="none" ${W(2.6)}/>`;
  return `
<path d="M70 30 C88 30 92 52 84 66 C80 58 78 46 70 40Z" fill="url(#${id}h)" ${W(3)}/>
<path d="M14 54 C12 30 28 14 48 14 C68 14 84 30 82 54 C82 78 66 90 48 90 C30 90 14 78 14 54Z" fill="url(#${id}s)" ${W()}/>
<path d="M14 50 C12 26 30 10 48 10 C66 10 84 26 82 50 C76 40 64 36 48 36 C32 36 20 40 14 50Z" fill="url(#${id}h)" ${W()}/>
<path d="M15 44 C24 34 36 31 48 31 C60 31 72 34 81 44 L80 52 C70 44 60 41 48 41 C36 41 26 44 16 52Z" fill="url(#${id}b)" ${W(3)}/>
<path d="M24 40 C32 36 40 35 48 35" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".55" fill="none"/>
<ellipse cx="34" cy="20" rx="8" ry="3" fill="#fff" opacity=".18"/>`;
}

const BL = `<ellipse cx="27" cy="67" rx="6" ry="3.5" fill="#FF8FA0" opacity=".6"/><ellipse cx="69" cy="67" rx="6" ry="3.5" fill="#FF8FA0" opacity=".6"/>`;
const BLUSH_BIG = `<ellipse cx="27" cy="67" rx="8" ry="4.5" fill="#FF6F86" opacity=".75"/><ellipse cx="69" cy="67" rx="8" ry="4.5" fill="#FF6F86" opacity=".75"/>`;
const L = 35, R = 61, EY = 57, MY = 74;

// ---- eyes ----
const arc = (x: number, up: boolean) => `<path d="M${x - 6} ${EY + (up ? 2 : -1)} Q${x} ${EY + (up ? -6 : 5)} ${x + 6} ${EY + (up ? 2 : -1)}" fill="none" ${W()}/>`;
const roundEye = (x: number, px = 0, py = 0, r = 8) => `<circle cx="${x}" cy="${EY}" r="${r}" fill="#fff" ${W(2.5)}/><circle cx="${x + px}" cy="${EY + py}" r="${r * 0.42}" fill="${O}"/><circle cx="${x + px + 1.5}" cy="${EY + py - 1.5}" r="1.2" fill="#fff"/>`;
const EYES: Record<string, string> = {
  happy: arc(L, true) + arc(R, true),
  closed: arc(L, false) + arc(R, false),
  dot: `<circle cx="${L}" cy="${EY}" r="3.4" fill="${O}"/><circle cx="${R}" cy="${EY}" r="3.4" fill="${O}"/>`,
  round: roundEye(L) + roundEye(R),
  roundUp: roundEye(L, 0, -3.5) + roundEye(R, 0, -3.5),
  roundSide: roundEye(L, 3.5, 0) + roundEye(R, 3.5, 0),
  huge: roundEye(L, 0, 0, 10) + roundEye(R, 0, 0, 10),
  heart: [L, R].map((x) => `<path d="M${x} ${EY + 7} C${x - 12} ${EY - 1} ${x - 8} ${EY - 11} ${x} ${EY - 4} C${x + 8} ${EY - 11} ${x + 12} ${EY - 1} ${x} ${EY + 7}Z" fill="#E8394A" ${W(2)}/>`).join(''),
  squint: `<path d="M${L - 7} ${EY - 5} L${L + 5} ${EY} L${L - 7} ${EY + 5}" fill="none" ${W()}/><path d="M${R + 7} ${EY - 5} L${R - 5} ${EY} L${R + 7} ${EY + 5}" fill="none" ${W()}/>`,
  shades: `<rect x="${L - 13}" y="${EY - 7}" width="${R - L + 26}" height="4" fill="${O}"/>` + [L, R].map((x) => `<rect x="${x - 11}" y="${EY - 4}" width="22" height="9" fill="${O}"/><rect x="${x - 7}" y="${EY - 3}" width="4" height="3" fill="#fff"/><rect x="${x - 2}" y="${EY - 3}" width="3" height="3" fill="#fff"/>`).join('') + `<rect x="${L + 11}" y="${EY - 3}" width="${R - L - 22}" height="3" fill="${O}"/>`,
  sob: `<path d="M${L - 7} ${EY} L${L + 6} ${EY - 4}" ${W()}/><path d="M${R + 7} ${EY} L${R - 6} ${EY - 4}" ${W()}/>` + [L, R].map((x) => `<path d="M${x - 3} ${EY + 2} q-2 16 -1 28 l8 0 q-1 -12 -1 -28z" fill="#5EC2F2" ${W(1.5)}/>`).join(''),
  spiral: [L, R].map((x) => `<path d="M${x} ${EY} m-1 0 a1.5 1.5 0 1 1 3 0 a3 3 0 1 1 -6 0 a4.5 4.5 0 1 1 9 0 a6 6 0 1 1 -12 0" fill="none" stroke="#C2185B" stroke-width="2"/>`).join(''),
  star: [L, R].map((x) => `<circle cx="${x}" cy="${EY}" r="9" fill="#fff" ${W(2.5)}/><path d="M${x} ${EY - 6} l2 4.2 4.6 .6 -3.4 3.2 .9 4.6 -4.1 -2.3 -4.1 2.3 .9 -4.6 -3.4 -3.2 4.6 -.6z" fill="#F5B21B"/>`).join(''),
  flat: `<path d="M${L - 7} ${EY} L${L + 7} ${EY}" ${W()}/><path d="M${R - 7} ${EY} L${R + 7} ${EY}" ${W()}/>`,
  half: [L, R].map((x) => `<path d="M${x - 7} ${EY - 1} L${x + 7} ${EY - 1}" ${W()}/><path d="M${x - 5} ${EY - 1} Q${x} ${EY + 6} ${x + 5} ${EY - 1}" fill="${O}"/>`).join(''),
  sad: `<path d="M${L - 7} ${EY - 7} L${L + 5} ${EY - 10}" ${W(3)}/><path d="M${R + 7} ${EY - 7} L${R - 5} ${EY - 10}" ${W(3)}/><circle cx="${L}" cy="${EY + 1}" r="3.2" fill="${O}"/><circle cx="${R}" cy="${EY + 1}" r="3.2" fill="${O}"/>`,
  sadClosed: `<path d="M${L - 7} ${EY - 8} L${L + 5} ${EY - 11}" ${W(3)}/><path d="M${R + 7} ${EY - 8} L${R - 5} ${EY - 11}" ${W(3)}/>` + arc(L, false) + arc(R, false),
  angry: `<path d="M${L - 8} ${EY - 9} L${L + 6} ${EY - 3}" ${W(4)}/><path d="M${R + 8} ${EY - 9} L${R - 6} ${EY - 3}" ${W(4)}/><circle cx="${L}" cy="${EY + 2}" r="3.5" fill="${O}"/><circle cx="${R}" cy="${EY + 2}" r="3.5" fill="${O}"/>`,
  determined: `<path d="M${L - 7} ${EY - 7} L${L + 6} ${EY - 4}" ${W()}/><path d="M${R + 7} ${EY - 7} L${R - 6} ${EY - 4}" ${W()}/><circle cx="${L}" cy="${EY + 2}" r="3.2" fill="${O}"/><circle cx="${R}" cy="${EY + 2}" r="3.2" fill="${O}"/>`,
  wink: arc(L, true) + `<circle cx="${R}" cy="${EY}" r="3.4" fill="${O}"/>`,
  x: [L, R].map((x) => `<path d="M${x - 5} ${EY - 5} L${x + 5} ${EY + 5} M${x + 5} ${EY - 5} L${x - 5} ${EY + 5}" ${W()}/>`).join(''),
  tired: `<circle cx="${L}" cy="${EY}" r="3.2" fill="${O}"/><circle cx="${R}" cy="${EY}" r="3.2" fill="${O}"/><path d="M${L - 7} ${EY + 6} Q${L} ${EY + 10} ${L + 7} ${EY + 6} M${R - 7} ${EY + 6} Q${R} ${EY + 10} ${R + 7} ${EY + 6}" fill="none" stroke="#7A5A8A" stroke-width="2.5" stroke-linecap="round"/>`,
  puppy: [L, R].map((x) => `<circle cx="${x}" cy="${EY}" r="8.5" fill="${O}"/><circle cx="${x + 2.5}" cy="${EY - 2.5}" r="3" fill="#fff"/><circle cx="${x - 2.5}" cy="${EY + 3}" r="1.4" fill="#fff"/>`).join('') + `<path d="M${L - 8} ${EY - 11} L${L + 5} ${EY - 13}" ${W(2.5)}/><path d="M${R + 8} ${EY - 11} L${R - 5} ${EY - 13}" ${W(2.5)}/>`,
  side: [L, R].map((x) => `<path d="M${x - 7} ${EY - 2} L${x + 7} ${EY - 2}" ${W(3)}/><circle cx="${x + 3}" cy="${EY + 1.5}" r="3" fill="${O}"/>`).join(''),
  glasses: [L, R].map((x) => `<circle cx="${x}" cy="${EY}" r="9.5" fill="#fff" ${W(3)}/><circle cx="${x}" cy="${EY}" r="3.4" fill="${O}"/>`).join('') + `<path d="M${L + 9.5} ${EY} L${R - 9.5} ${EY}" ${W(3)}/>`,
  glassesSquint: [L, R].map((x) => `<circle cx="${x}" cy="${EY}" r="9.5" fill="#fff" ${W(3)}/>`).join('') + `<path d="M${L + 9.5} ${EY} L${R - 9.5} ${EY}" ${W(3)}/>` + arc(L, true) + arc(R, true),
  up: `<path d="M${L - 6} ${EY + 2} Q${L} ${EY - 3} ${L + 6} ${EY + 2}" fill="none" ${W(3)}/><path d="M${R - 6} ${EY + 2} Q${R} ${EY - 3} ${R + 6} ${EY + 2}" fill="none" ${W(3)}/><circle cx="${L}" cy="${EY - 2}" r="2.6" fill="${O}"/><circle cx="${R}" cy="${EY - 2}" r="2.6" fill="${O}"/>`
};

// ---- mouths ----
const M = 48;
const MOUTH: Record<string, string> = {
  grin: `<path d="M${M - 14} ${MY - 4} Q${M} ${MY + 15} ${M + 14} ${MY - 4} Z" fill="#7A2430" ${W(2.5)}/><path d="M${M - 10} ${MY - 2} L${M + 10} ${MY - 2} L${M + 9} ${MY + 2} L${M - 9} ${MY + 2}Z" fill="#fff"/><path d="M${M - 6} ${MY + 6} Q${M} ${MY + 3} ${M + 6} ${MY + 6} Q${M} ${MY + 9} ${M - 6} ${MY + 6}" fill="#F27A8A"/>`,
  teeth: `<rect x="${M - 14}" y="${MY - 5}" width="28" height="11" rx="5" fill="#fff" ${W(2.5)}/><path d="M${M - 14} ${MY} L${M + 14} ${MY} M${M - 7} ${MY - 5} v11 M${M} ${MY - 5} v11 M${M + 7} ${MY - 5} v11" stroke="${O}" stroke-width="1.5"/>`,
  smile: `<path d="M${M - 9} ${MY - 2} Q${M} ${MY + 7} ${M + 9} ${MY - 2}" fill="none" ${W(3)}/>`,
  o: `<ellipse cx="${M}" cy="${MY + 1}" rx="3.5" ry="4" fill="#7A2430" ${W(2.2)}/>`,
  bigO: `<ellipse cx="${M}" cy="${MY + 3}" rx="7" ry="9" fill="#7A2430" ${W(2.5)}/><ellipse cx="${M}" cy="${MY + 7}" rx="4" ry="3" fill="#F27A8A"/>`,
  wavy: `<path d="M${M - 10} ${MY + 1} q2.5 -4 5 0 t5 0 t5 0 t5 0" fill="none" ${W(2.8)}/>`,
  frown: `<path d="M${M - 9} ${MY + 4} Q${M} ${MY - 4} ${M + 9} ${MY + 4}" fill="none" ${W(3)}/>`,
  flat: `<path d="M${M - 7} ${MY + 1} L${M + 7} ${MY + 1}" ${W(3)}/>`,
  smirk: `<path d="M${M - 8} ${MY + 1} Q${M + 2} ${MY + 6} ${M + 10} ${MY - 3}" fill="none" ${W(3)}/>`,
  sideFrown: `<path d="M${M - 6} ${MY + 3} Q${M + 2} ${MY - 2} ${M + 9} ${MY + 2}" fill="none" ${W(3)}/>`,
  tongue: `<path d="M${M - 10} ${MY - 2} Q${M} ${MY + 6} ${M + 10} ${MY - 2}" fill="none" ${W(3)}/><path d="M${M + 1} ${MY + 2} q1 8 7 6 q4 -2 0 -8" fill="#F27A8A" ${W(2)}/>`,
  kiss: `<path d="M${M - 2} ${MY - 5} q6 2 0 5 q6 2 0 5" fill="none" ${W(3)}/>`,
  pucker: `<ellipse cx="${M + 2}" cy="${MY + 1}" rx="4" ry="3.5" fill="#E8394A" ${W(2)}/>`,
  scream: `<path d="M${M - 8} ${MY - 4} Q${M} ${MY - 7} ${M + 8} ${MY - 4} L${M + 6} ${MY + 13} Q${M} ${MY + 16} ${M - 6} ${MY + 13}Z" fill="#7A2430" ${W(2.5)}/><path d="M${M - 7} ${MY - 3} L${M + 7} ${MY - 3}" stroke="#fff" stroke-width="2.5"/>`,
  cry: `<path d="M${M - 12} ${MY + 8} Q${M} ${MY - 9} ${M + 12} ${MY + 8} Z" fill="#7A2430" ${W(2.5)}/>`,
  wail: `<path d="M${M - 13} ${MY - 5} L${M + 13} ${MY - 5} L${M + 9} ${MY + 11} L${M - 9} ${MY + 11}Z" fill="#7A2430" ${W(2.5)}/><path d="M${M - 11} ${MY - 4} l3 4 3 -4 3 4 3 -4 3 4 3 -4 3 4" fill="#fff"/><ellipse cx="${M}" cy="${MY + 7}" rx="5" ry="2.5" fill="#F27A8A"/>`,
  laugh: `<path d="M${M - 15} ${MY - 5} Q${M} ${MY + 17} ${M + 15} ${MY - 5} Z" fill="#7A2430" ${W(2.5)}/><path d="M${M - 7} ${MY + 6} Q${M} ${MY + 2} ${M + 7} ${MY + 6} Q${M} ${MY + 10} ${M - 7} ${MY + 6}" fill="#F27A8A"/>`,
  drool: `<path d="M${M - 9} ${MY - 2} Q${M} ${MY + 6} ${M + 9} ${MY - 2}" fill="none" ${W(3)}/><path d="M${M + 6} ${MY + 2} q1 8 3 9 q2 -2 0 -9" fill="#9AD8F5" ${W(1.5)}/>`,
  none: ''
};

// ---- extras (hands, props, effects) ----
const hand = (x: number, y: number, r = 0) => `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="9" ry="8" fill="#F6C29C" ${W(2.5)}/><path d="M${x - 5} ${y - 6} v5 M${x} ${y - 7} v5 M${x + 5} ${y - 6} v5" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/></g>`;
const X: Record<string, string> = {
  sweat: `<path d="M78 34 q5 7 4 11 q-2 4 -6 2 q-3 -4 2 -13z" fill="#7FD0F5" ${W(1.8)}/>`,
  sweatL: `<path d="M18 38 q-5 7 -4 11 q2 4 6 2 q3 -4 -2 -13z" fill="#7FD0F5" ${W(1.8)}/>`,
  tearsSide: `<path d="M24 62 q-8 4 -6 12 q6 -2 6 -12z M72 62 q8 4 6 12 q-6 -2 -6 -12z" fill="#7FD0F5" ${W(1.5)}/>`,
  blush: BLUSH_BIG,
  fire: `<path d="M12 40 q-8 -18 6 -30 q-2 12 6 14 q0 -12 10 -18 q-4 14 6 22 q-4 8 -14 12z" fill="#FF7A1A" ${W(2)}/><path d="M84 40 q8 -18 -6 -30 q2 12 -6 14 q0 -12 -10 -18 q4 14 -6 22 q4 8 14 12z" fill="#FF7A1A" ${W(2)}/><path d="M20 34 q-4 -8 2 -14 q0 6 4 8z M76 34 q4 -8 -2 -14 q0 6 -4 8z" fill="#FFD23F"/>`,
  zzz: `<text x="66" y="24" font-family="Arial Black,Arial" font-weight="900" font-size="16" fill="#fff" stroke="${O}" stroke-width="1.6">Z</text><text x="78" y="13" font-family="Arial Black,Arial" font-weight="900" font-size="11" fill="#fff" stroke="${O}" stroke-width="1.2">z</text>`,
  bubble: `<circle cx="60" cy="80" r="9" fill="#BFE9FF" opacity=".85" ${W(2)}/><ellipse cx="57" cy="77" rx="3" ry="2" fill="#fff"/>`,
  tape: `<g transform="rotate(-12 48 75)"><rect x="34" y="70" width="28" height="9" rx="2" fill="#F1E3C8" ${W(2)}/></g><g transform="rotate(14 48 75)"><rect x="34" y="70" width="28" height="9" rx="2" fill="#F1E3C8" ${W(2)}/></g>`,
  handMouth: hand(50, 80),
  handsCheeks: hand(18, 76, -20) + hand(78, 76, 20),
  fists: hand(28, 90) + hand(68, 90),
  shush: `<rect x="44" y="64" width="8" height="22" rx="4" fill="#F6C29C" ${W(2.5)}/>` + hand(48, 88),
  salute: `<path d="M8 46 L30 36 L34 44 L12 54 Z" fill="#F6C29C" ${W(2.5)}/><path d="M12 54 L4 66" ${W(6)}/><path d="M12 54 L4 66" stroke="#F6C29C" stroke-width="3" stroke-linecap="round"/>`,
  flower: `<path d="M66 92 Q70 70 74 56" stroke="#3E8E4A" stroke-width="3" fill="none"/>` + [0, 72, 144, 216, 288].map((a) => `<ellipse cx="74" cy="40" rx="7" ry="10" fill="#F2545B" ${W(2)} transform="rotate(${a} 74 50)"/>`).join('') + `<circle cx="74" cy="50" r="6" fill="#FFD23F" ${W(2)}/>` + hand(68, 82),
  okHand: `<circle cx="80" cy="70" r="6" fill="none" stroke="#F6C29C" stroke-width="5"/><circle cx="80" cy="70" r="6" fill="none" ${W(1.5)}/>` + `<path d="M84 60 v-12 M88 62 v-10 M91 66 v-8" stroke="#F6C29C" stroke-width="5" stroke-linecap="round"/><path d="M84 60 v-12 M88 62 v-10 M91 66 v-8" fill="none" stroke="${O}" stroke-width="1.2"/>` + hand(82, 82),
  wave: hand(16, 70, -15) + `<path d="M6 54 q-2 -6 2 -9 M10 50 q0 -6 4 -8" stroke="${O}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  facepalm: `<g transform="rotate(-25 66 54)"><rect x="54" y="40" width="26" height="22" rx="10" fill="#F6C29C" ${W(2.5)}/><path d="M60 40 v8 M66 40 v8 M72 40 v8" stroke="${O}" stroke-width="1.5"/></g>`,
  pick: `<rect x="46" y="60" width="7" height="16" rx="3.5" fill="#F6C29C" ${W(2.2)} transform="rotate(-10 49 68)"/>` + hand(52, 84),
  tissue: `<path d="M30 70 Q48 60 66 70 L64 90 L32 90Z" fill="#fff" ${W(2.5)}/>` + hand(28, 84) + hand(68, 84),
  peek: `<rect x="18" y="52" width="26" height="22" rx="10" fill="#F6C29C" ${W(2.5)}/><rect x="52" y="52" width="26" height="22" rx="10" fill="#F6C29C" ${W(2.5)}/><path d="M24 52 v8 M30 52 v8 M36 52 v8 M58 52 v8 M64 52 v8 M70 52 v8" stroke="${O}" stroke-width="1.5"/>`,
  crack: `<path d="M42 12 L46 26 L40 36 L48 48 L44 60" fill="none" stroke="${O}" stroke-width="2.5"/><path d="M46 26 L54 30" stroke="${O}" stroke-width="2"/>`,
  nosebleed: `<path d="M50 64 q-1 6 2 12 q3 -1 2 -6" fill="#D6202F" ${W(1.2)}/>`,
  vomit: `<path d="M40 76 Q48 70 56 76 L62 94 L34 94Z" fill="#9BD86A" ${W(2)}/><circle cx="42" cy="88" r="2" fill="#6BAA3E"/><circle cx="54" cy="86" r="2.5" fill="#6BAA3E"/>`,
  shadeTop: `<path d="M16 50 C20 36 34 30 48 30 C62 30 76 36 80 50 L80 60 L16 60Z" fill="#6B4BA8" opacity=".45"/>`,
  question: `<text x="70" y="26" font-family="Arial Black,Arial" font-weight="900" font-size="20" fill="#fff" stroke="${O}" stroke-width="1.8">?</text>`,
  note: `<text x="64" y="74" font-family="Arial" font-size="18" fill="${O}">♪</text>`,
  anger: `<path d="M70 22 l5 6 m2 -9 l-7 3 M64 18 l1 -6" stroke="#E8394A" stroke-width="3" stroke-linecap="round"/>`,
  dumbbell: `<rect x="64" y="70" width="26" height="5" rx="2" fill="#8A8F99" ${W(2)}/><rect x="60" y="64" width="7" height="17" rx="2" fill="#4A4F59" ${W(2)}/><rect x="87" y="64" width="7" height="17" rx="2" fill="#4A4F59" ${W(2)}/>` + hand(76, 82),
  flex: `<path d="M70 82 q6 -18 18 -14 q8 4 3 14 q-4 6 -11 4 q-5 4 -10 -4z" fill="#F6C29C" ${W(2.5)}/><path d="M80 72 q5 -3 8 2" stroke="${O}" stroke-width="1.5" fill="none"/>`,
  sparkles: `<path d="M16 22 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z M82 18 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z" fill="#FFD23F" ${W(1.2)}/>`,
  mask: `<path d="M24 64 Q48 58 72 64 L70 84 Q48 92 26 84Z" fill="#F4F6F8" ${W(2.5)}/><path d="M30 70 Q48 66 66 70 M30 76 Q48 72 66 76" stroke="#C9CDD2" stroke-width="1.5" fill="none"/>`
};

function face(id: string, f: Face): string {
  const skin = f.skin ?? 'normal';
  const body = f.turned ? head(id, true) : head(id) + (skin === 'normal' || skin === 'sun' ? BL : '') + (EYES[f.eyes] ?? '') + (MOUTH[f.mouth] ?? '');
  return defs(id, skin) + body + (f.extras ?? []).map((e) => X[e] ?? '').join('');
}

// ---- standalone icons ----
const SK = '#F6C29C';
const ICON: Record<string, string> = {
  lips: `<path d="M10 48 Q26 28 40 38 Q48 32 56 38 Q70 28 86 48 Q70 70 48 72 Q26 70 10 48Z" fill="#D7263D" ${W(3)}/><path d="M12 48 Q48 52 84 48" stroke="${O}" stroke-width="2.5" fill="none"/><path d="M26 42 Q34 38 40 42" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round" fill="none"/>`,
  heart: `<path d="M48 84 C14 60 10 36 26 24 C38 16 46 24 48 32 C50 24 58 16 70 24 C86 36 82 60 48 84Z" fill="#F0506E" ${W(3.5)}/><path d="M28 32 Q32 26 38 28" stroke="#fff" stroke-width="4" opacity=".6" stroke-linecap="round" fill="none"/>`,
  muscle: `<path d="M18 80 L18 56 Q20 40 34 36 Q30 22 40 16 Q52 12 56 24 Q58 32 50 36 Q66 40 76 56 Q82 72 66 80Z" fill="${SK}" ${W(3)}/><path d="M50 50 Q60 46 66 56" stroke="${O}" stroke-width="2" fill="none"/><path d="M78 20 l6 -4 M82 30 l7 0 M74 12 l2 -6" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`,
  fist: `<rect x="28" y="30" width="40" height="36" rx="12" fill="${SK}" ${W(3)}/><path d="M38 30 v14 M48 30 v14 M58 30 v14" stroke="${O}" stroke-width="2"/><path d="M30 50 Q22 48 22 58 Q24 64 32 62" fill="${SK}" ${W(3)}/><rect x="32" y="64" width="32" height="18" fill="${SK}" ${W(3)}/><path d="M16 26 l-6 -6 M80 26 l6 -6 M48 18 v-8" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`,
  pray: `<path d="M46 14 Q36 30 34 54 L30 84 L46 84 Z" fill="${SK}" ${W(3)}/><path d="M50 14 Q60 30 62 54 L66 84 L50 84 Z" fill="${SK}" ${W(3)}/><rect x="26" y="80" width="22" height="10" fill="#2E4A7A" ${W(2.5)}/><rect x="48" y="80" width="22" height="10" fill="#2E4A7A" ${W(2.5)}/>`,
  thumbsUp: `<path d="M30 46 L44 22 Q50 14 54 22 L52 40 L72 40 Q80 42 78 50 L72 74 Q70 80 62 80 L30 80Z" fill="${SK}" ${W(3)}/><rect x="16" y="44" width="14" height="38" fill="#2E4A7A" ${W(3)}/><path d="M56 50 L76 50 M56 60 L74 60 M56 70 L72 70" stroke="${O}" stroke-width="2"/>`,
  thumbsDown: `<g transform="rotate(180 48 50)"><path d="M30 46 L44 22 Q50 14 54 22 L52 40 L72 40 Q80 42 78 50 L72 74 Q70 80 62 80 L30 80Z" fill="${SK}" ${W(3)}/><rect x="16" y="44" width="14" height="38" fill="#2E4A7A" ${W(3)}/><path d="M56 50 L76 50 M56 60 L74 60 M56 70 L72 70" stroke="${O}" stroke-width="2"/></g>`,
  peace: `<path d="M38 50 L30 14 Q34 8 40 14 L48 44 L56 12 Q62 8 66 14 L60 52 Q70 56 68 70 Q64 86 46 86 Q32 84 32 70Z" fill="${SK}" ${W(3)}/><path d="M40 58 Q48 54 56 60" stroke="${O}" stroke-width="2" fill="none"/>`,
  handshake: `<path d="M8 40 L26 36 L48 50 L64 40 L88 44 L88 62 L70 66 L50 80 Q44 84 38 78 L20 62 L8 62Z" fill="${SK}" ${W(3)}/><rect x="2" y="36" width="10" height="28" fill="#2E4A7A" ${W(2.5)}/><rect x="84" y="40" width="10" height="26" fill="#2E4A7A" ${W(2.5)}/><path d="M40 62 L50 70 M46 58 L56 66 M52 54 L60 60" stroke="${O}" stroke-width="2"/>`,
  bomb: `<circle cx="44" cy="58" r="28" fill="#2A2A32" ${W(3)}/><rect x="52" y="26" width="14" height="10" rx="2" fill="#4A4A55" ${W(2.5)} transform="rotate(35 59 31)"/><path d="M64 26 Q70 14 80 16" stroke="#8A6A4A" stroke-width="3" fill="none"/><path d="M80 16 l4 -8 2 7 7 -2 -5 6 6 4 -8 0z" fill="#FFB020" ${W(1.5)}/><path d="M30 54 l8 4 M50 54 l-8 4" stroke="#E8394A" stroke-width="3" stroke-linecap="round"/><path d="M30 46 Q36 40 44 42" stroke="#fff" stroke-width="3" opacity=".3" fill="none"/>`,
  party: `<path d="M14 84 L40 30 L66 58Z" fill="#F5B21B" ${W(3)}/><path d="M24 64 L50 44 M30 76 L58 52" stroke="#E8394A" stroke-width="4"/><path d="M50 22 q8 -6 10 4 M66 34 q10 0 8 10 M60 16 l4 -8 M78 22 l8 -4 M72 48 l10 2" stroke="#3EA6E0" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="76" cy="12" r="3" fill="#E8394A"/><circle cx="86" cy="34" r="3" fill="#7FC9A4"/><circle cx="58" cy="8" r="2.5" fill="#F5B21B"/>`,
  skull: `<path d="M18 46 C18 22 34 12 48 12 C62 12 78 22 78 46 C78 58 72 62 70 66 L70 78 L26 78 L26 66 C24 62 18 58 18 46Z" fill="#E8E6E2" ${W(3)}/><ellipse cx="36" cy="46" rx="9" ry="10" fill="#5A5856"/><ellipse cx="60" cy="46" rx="9" ry="10" fill="#5A5856"/><path d="M48 56 l-4 8 h8z" fill="#5A5856"/><path d="M38 78 v-8 M48 78 v-8 M58 78 v-8" stroke="${O}" stroke-width="2"/>`,
  dumbbell: `<rect x="22" y="44" width="52" height="8" rx="3" fill="#A9AEB8" ${W(2.5)}/><rect x="12" y="30" width="12" height="36" rx="3" fill="#4A4F59" ${W(2.5)}/><rect x="72" y="30" width="12" height="36" rx="3" fill="#4A4F59" ${W(2.5)}/><rect x="4" y="36" width="10" height="24" rx="3" fill="#4A4F59" ${W(2.5)}/><rect x="82" y="36" width="10" height="24" rx="3" fill="#4A4F59" ${W(2.5)}/>`,
  dizzyMad: `<circle cx="48" cy="50" r="34" fill="#FF6B35" ${W(3)}/><path d="M30 40 l10 10 M40 40 l-10 10 M56 40 l10 10 M66 40 l-10 10" ${W(3)}/><path d="M34 70 Q48 60 62 70" fill="none" ${W(3)}/><path d="M24 30 q-4 6 -2 9 q3 2 5 -1 q0 -4 -3 -8z" fill="#7FD0F5" ${W(1.5)}/>`,
  yellowLaugh: `<circle cx="48" cy="50" r="34" fill="#FFD23F" ${W(3)}/><circle cx="36" cy="42" r="6" fill="#fff" ${W(2)}/><circle cx="60" cy="42" r="6" fill="#fff" ${W(2)}/><circle cx="36" cy="42" r="2.5" fill="${O}"/><circle cx="60" cy="42" r="2.5" fill="${O}"/><path d="M30 58 Q48 82 66 58Z" fill="#7A2430" ${W(2.5)}/><ellipse cx="24" cy="54" rx="5" ry="3" fill="#FF8FA0"/><ellipse cx="72" cy="54" rx="5" ry="3" fill="#FF8FA0"/>`,
  greenMeh: `<circle cx="48" cy="50" r="34" fill="#8EDB6A" ${W(3)}/><circle cx="36" cy="44" r="6" fill="#fff" ${W(2)}/><circle cx="60" cy="44" r="6" fill="#fff" ${W(2)}/><circle cx="36" cy="44" r="2.5" fill="${O}"/><circle cx="60" cy="44" r="2.5" fill="${O}"/><path d="M38 64 L58 64" ${W(3)}/><ellipse cx="24" cy="56" rx="5" ry="3" fill="#FF8FA0"/><ellipse cx="72" cy="56" rx="5" ry="3" fill="#FF8FA0"/>`,
  blueSad: `<circle cx="48" cy="50" r="34" fill="#62C3F0" ${W(3)}/><circle cx="36" cy="44" r="6" fill="#fff" ${W(2)}/><circle cx="60" cy="44" r="6" fill="#fff" ${W(2)}/><circle cx="36" cy="45" r="2.5" fill="${O}"/><circle cx="60" cy="45" r="2.5" fill="${O}"/><path d="M36 68 Q48 58 60 68" fill="none" ${W(3)}/>`,
  purpleGrimace: `<circle cx="48" cy="50" r="34" fill="#6F7CF0" ${W(3)}/><circle cx="36" cy="40" r="6" fill="#fff" ${W(2)}/><circle cx="60" cy="40" r="6" fill="#fff" ${W(2)}/><circle cx="36" cy="40" r="2.5" fill="${O}"/><circle cx="60" cy="40" r="2.5" fill="${O}"/><rect x="30" y="56" width="36" height="14" rx="6" fill="#fff" ${W(2.5)}/><path d="M30 63 h36 M39 56 v14 M48 56 v14 M57 56 v14" stroke="${O}" stroke-width="1.5"/>`
};

// ---- the set (order mirrors the panel) ----
export const STICKERS: { id: string; label: string; face?: Face; icon?: string }[] = [
  { id: 'grin', label: 'Yay', face: { eyes: 'happy', mouth: 'grin' } },
  { id: 'uhh', label: 'Uhh', face: { eyes: 'sad', mouth: 'wavy' } },
  { id: 'inlove', label: 'In love', face: { eyes: 'heart', mouth: 'grin' } },
  { id: 'nervous', label: 'Nervous', face: { eyes: 'round', mouth: 'o', extras: ['sweat'] } },
  { id: 'cool', label: 'Cool', face: { eyes: 'shades', mouth: 'smirk' } },
  { id: 'sob', label: 'Sobbing', face: { eyes: 'sob', mouth: 'cry' } },
  { id: 'content', label: 'Content', face: { eyes: 'closed', mouth: 'smile' } },
  { id: 'zipped', label: 'Zipped', face: { eyes: 'huge', mouth: 'none', extras: ['tape'] } },
  { id: 'sleepy', label: 'Sleepy', face: { eyes: 'closed', mouth: 'o', extras: ['zzz', 'bubble'] } },
  { id: 'teary', label: 'Teary', face: { eyes: 'squint', mouth: 'frown', extras: ['tearsSide'] } },
  { id: 'phew', label: 'Phew', face: { eyes: 'happy', mouth: 'laugh', extras: ['sweat'] } },
  { id: 'furious', label: 'Furious', face: { skin: 'red', eyes: 'angry', mouth: 'teeth', extras: ['fire', 'anger'] } },
  { id: 'shook', label: 'Shook', face: { eyes: 'glasses', mouth: 'o' } },
  { id: 'sad', label: 'Sad', face: { eyes: 'dot', mouth: 'frown' } },
  { id: 'uhoh', label: 'Uh oh', face: { eyes: 'roundUp', mouth: 'o', extras: ['sweat', 'sweatL'] } },
  { id: 'wail', label: 'Waaah', face: { eyes: 'squint', mouth: 'wail', extras: ['fists'] } },
  { id: 'sick', label: 'Sick', face: { skin: 'green', eyes: 'happy', mouth: 'none', extras: ['vomit'] } },
  { id: 'giggle', label: 'Giggle', face: { eyes: 'happy', mouth: 'none', extras: ['handMouth', 'blush'] } },
  { id: 'hmm', label: 'Hmm', face: { eyes: 'up', mouth: 'sideFrown' } },
  { id: 'drained', label: 'Drained', face: { eyes: 'tired', mouth: 'flat' } },
  { id: 'awkward', label: 'Awkward', face: { eyes: 'squint', mouth: 'smile', extras: ['sweat', 'blush'] } },
  { id: 'unbothered', label: 'Unbothered', face: { eyes: 'shades', mouth: 'o' } },
  { id: 'bawling', label: 'Bawling', face: { eyes: 'sob', mouth: 'wail' } },
  { id: 'whaat', label: 'Whaaat', face: { eyes: 'round', mouth: 'none', extras: ['handMouth', 'question'] } },
  { id: 'shh', label: 'Shh', face: { eyes: 'round', mouth: 'none', extras: ['shush'] } },
  { id: 'dizzy', label: 'Dizzy', face: { eyes: 'spiral', mouth: 'wavy' } },
  { id: 'burnt', label: 'Burnt', face: { skin: 'soot', eyes: 'round', mouth: 'o' } },
  { id: 'dead', label: 'Dead', icon: 'skull' },
  { id: 'pout', label: 'Pout', face: { eyes: 'squint', mouth: 'frown', extras: ['fists', 'blush'] } },
  { id: 'hii', label: 'Hii', face: { eyes: 'round', mouth: 'smile', extras: ['wave'] } },
  { id: 'eek', label: 'Eek', face: { eyes: 'round', mouth: 'none', extras: ['handMouth', 'nosebleed'] } },
  { id: 'worried', label: 'Worried', face: { eyes: 'sad', mouth: 'wavy', extras: ['fists'] } },
  { id: 'lol', label: 'LOL', face: { eyes: 'squint', mouth: 'laugh' } },
  { id: 'smooch', label: 'Smooch', face: { eyes: 'squint', mouth: 'kiss', extras: ['blush'] } },
  { id: 'starry', label: 'Amazed', face: { eyes: 'star', mouth: 'bigO', extras: ['handsCheeks', 'sparkles'] } },
  { id: 'masked', label: 'Masked', face: { eyes: 'closed', mouth: 'none', extras: ['mask'] } },
  { id: 'joy', label: 'Tears of joy', face: { eyes: 'squint', mouth: 'laugh', extras: ['tearsSide'] } },
  { id: 'scream', label: 'Scream', face: { skin: 'pale', eyes: 'huge', mouth: 'scream', extras: ['shadeTop', 'handsCheeks'] } },
  { id: 'down', label: 'Down', face: { eyes: 'sadClosed', mouth: 'frown' } },
  { id: 'meh', label: 'Meh', face: { eyes: 'half', mouth: 'sideFrown' } },
  { id: 'sly', label: 'Sly', face: { eyes: 'side', mouth: 'smirk' } },
  { id: 'okay', label: 'Okay', face: { eyes: 'side', mouth: 'smirk', extras: ['okHand'] } },
  { id: 'broken', label: 'Broken', face: { eyes: 'round', mouth: 'wavy', extras: ['crack'] } },
  { id: 'salute', label: 'Salute', face: { eyes: 'determined', mouth: 'flat', extras: ['salute'] } },
  { id: 'forYou', label: 'For you', face: { eyes: 'happy', mouth: 'smile', extras: ['flower', 'blush'] } },
  { id: 'yum', label: 'Yum', face: { eyes: 'happy', mouth: 'tongue', extras: ['blush'] } },
  { id: 'blank', label: 'Blank', face: { eyes: 'dot', mouth: 'flat', extras: ['blush'] } },
  { id: 'picky', label: 'Whatever', face: { eyes: 'half', mouth: 'none', extras: ['pick'] } },
  { id: 'hmph', label: 'Hmph', face: { eyes: 'dot', mouth: 'flat', turned: true, extras: ['anger'] } },
  { id: 'please', label: 'Pretty please', face: { eyes: 'puppy', mouth: 'o' } },
  { id: 'sweaty', label: 'So hot', face: { skin: 'sun', eyes: 'round', mouth: 'o', extras: ['sweat', 'sweatL'] } },
  { id: 'hahaCry', label: 'Haha cry', face: { eyes: 'happy', mouth: 'laugh', extras: ['tearsSide', 'facepalm'] } },
  { id: 'gross', label: 'Gross', face: { skin: 'green', eyes: 'squint', mouth: 'none', extras: ['vomit', 'sweat'] } },
  { id: 'lift', label: 'Lifting', face: { eyes: 'determined', mouth: 'teeth', extras: ['dumbbell', 'sweat'] } },
  { id: 'peek', label: 'Peeking', face: { eyes: 'round', mouth: 'none', extras: ['peek', 'blush'] } },
  { id: 'tissue', label: 'Crying it out', face: { eyes: 'sob', mouth: 'none', extras: ['tissue'] } },
  { id: 'whistle', label: 'Whistle', face: { eyes: 'up', mouth: 'pucker', extras: ['note'] } },
  { id: 'smug', label: 'Smug', face: { eyes: 'side', mouth: 'smile' } },
  { id: 'facepalm', label: 'Facepalm', face: { eyes: 'closed', mouth: 'wavy', extras: ['facepalm', 'sweat'] } },
  { id: 'kissy', label: 'Kissy', face: { eyes: 'glasses', mouth: 'pucker', extras: ['blush'] } },
  { id: 'strong', label: 'Strong', face: { eyes: 'determined', mouth: 'smile', extras: ['flex'] } },
  { id: 'lips', label: 'Kiss', icon: 'lips' },
  { id: 'heart', label: 'Heart', icon: 'heart' },
  { id: 'muscle', label: 'Muscle', icon: 'muscle' },
  { id: 'fist', label: 'Fist bump', icon: 'fist' },
  { id: 'dumbbell', label: 'Dumbbell', icon: 'dumbbell' },
  { id: 'pray', label: 'Please', icon: 'pray' },
  { id: 'thumbsUp', label: 'Thumbs up', icon: 'thumbsUp' },
  { id: 'thumbsDown', label: 'Thumbs down', icon: 'thumbsDown' },
  { id: 'peace', label: 'Peace', icon: 'peace' },
  { id: 'deal', label: 'Deal', icon: 'handshake' },
  { id: 'bomb', label: 'Bomb', icon: 'bomb' },
  { id: 'party', label: 'Party', icon: 'party' },
  { id: 'xMad', label: 'Done', icon: 'dizzyMad' },
  { id: 'yellowLaugh', label: 'Haha', icon: 'yellowLaugh' },
  { id: 'greenMeh', label: 'Meh', icon: 'greenMeh' },
  { id: 'blueSad', label: 'Blue', icon: 'blueSad' },
  { id: 'purpleGrimace', label: 'Yikes', icon: 'purpleGrimace' }
];

const cache = new Map<string, string>();
export function stickerSvg(id: string, size = 96): string {
  const k = id + size;
  const hit = cache.get(k);
  if (hit) return hit;
  const s = STICKERS.find((x) => x.id === id);
  if (!s) return '';
  const inner = s.icon ? ICON[s.icon] : face('gg' + id, s.face!);
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="${size}" height="${size}">${inner}</svg>`;
  cache.set(k, out);
  return out;
}
