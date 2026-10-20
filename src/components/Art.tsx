// Delicate line-art illustrations. Uses theme variables so they work in dark mode.
const S = { fill: 'none', stroke: 'var(--rose-deep)', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const plate = <ellipse cx="32" cy="38" rx="24" ry="14" fill="var(--card)" stroke="var(--blush)" strokeWidth={1.8} />;
const bowl = <path d="M10 32 h44 a22 18 0 0 1 -44 0 z" fill="var(--card)" stroke="var(--blush)" strokeWidth={1.8} />;

const ART: Record<string, JSX.Element> = {
  eggs: (<>{plate}<ellipse cx="25" cy="36" rx="9" ry="7" {...S} fill="#fff" /><circle cx="25" cy="36" r="3.4" fill="#F5C77A" stroke="none" /><ellipse cx="40" cy="38" rx="8" ry="6" {...S} fill="#fff" /><circle cx="40" cy="38" r="3" fill="#F5C77A" stroke="none" /><path d="M20 46 q6 3 12 0" {...S} /></>),
  oats: (<><path d="M20 18 h24 v30 a6 6 0 0 1 -6 6 h-12 a6 6 0 0 1 -6 -6 z" fill="var(--card)" stroke="var(--blush)" strokeWidth={1.8} /><path d="M20 30 h24" {...S} /><path d="M18 18 h28" {...S} /><circle cx="28" cy="25" r="3" fill="var(--rose)" stroke="none" /><circle cx="36" cy="24" r="2.6" fill="var(--rose)" stroke="none" /><path d="M24 40 h3 M31 44 h4 M28 36 h3" {...S} /></>),
  bowl: (<>{bowl}<circle cx="24" cy="30" r="5" fill="#B8CFA0" stroke="none" /><rect x="32" y="25" width="10" height="7" rx="2" fill="#F1D9C4" stroke="var(--rose-deep)" strokeWidth={1.2} /><circle cx="22" cy="40" r="1.4" fill="#F5C77A" stroke="none" /><circle cx="26" cy="42" r="1.4" fill="#F5C77A" stroke="none" /><path d="M36 38 q4 -3 8 0" {...S} /></>),
  taco: (<>{bowl}<circle cx="23" cy="30" r="2" fill="#5B4A55" stroke="none" /><circle cx="28" cy="29" r="2" fill="#5B4A55" stroke="none" /><path d="M33 28 q5 -4 10 0" stroke="#D98A6A" strokeWidth={3} strokeLinecap="round" fill="none" /><path d="M20 38 q6 2 10 0 M34 40 q4 2 8 0" {...S} /></>),
  salmon: (<>{plate}<path d="M16 36 q10 -10 22 -2 q-10 8 -22 2 z" fill="#F4B6A0" stroke="var(--rose-deep)" strokeWidth={1.4} /><path d="M22 33 l3 4 M28 31 l3 5" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" /><circle cx="44" cy="38" r="4" fill="#EBD3A6" stroke="var(--rose-deep)" strokeWidth={1.2} /><circle cx="40" cy="44" r="3.4" fill="#EBD3A6" stroke="var(--rose-deep)" strokeWidth={1.2} /><path d="M26 44 l8 -2 M27 47 l8 -2" stroke="#9DB899" strokeWidth={2} strokeLinecap="round" /></>),
  pasta: (<>{bowl}<path d="M18 30 l6 -4 M26 31 l6 -4 M34 30 l6 -4 M22 36 l6 -4 M30 37 l6 -4" stroke="#EBC88A" strokeWidth={3} strokeLinecap="round" /><path d="M40 34 q4 -4 6 1 q-3 3 -6 -1" fill="#F4A79A" stroke="var(--rose-deep)" strokeWidth={1.2} /><circle cx="20" cy="38" r="2" fill="#D9705E" stroke="none" /></>),
  skillet: (<><circle cx="28" cy="34" r="17" fill="var(--card)" stroke="var(--blush)" strokeWidth={1.8} /><path d="M44 30 h14" stroke="var(--blush)" strokeWidth={4} strokeLinecap="round" /><path d="M20 30 q2 -3 4 0 M28 28 q2 -3 4 0 M22 38 q2 -3 4 0 M31 37 q2 -3 4 0" stroke="#D9705E" strokeWidth={2.4} strokeLinecap="round" fill="none" /><path d="M24 34 h3 M33 32 h3" stroke="#F5E6B8" strokeWidth={2} strokeLinecap="round" /></>),
  yogurt: (<><path d="M20 22 h24 l-3 28 a4 4 0 0 1 -4 3 h-10 a4 4 0 0 1 -4 -3 z" fill="var(--card)" stroke="var(--blush)" strokeWidth={1.8} /><path d="M18 22 h28" {...S} /><path d="M24 32 h16" stroke="var(--petal)" strokeWidth={6} strokeLinecap="round" /><path d="M29 14 q3 4 0 8" {...S} /></>),
  'choc-berry': (<>{plate}<rect x="17" y="31" width="16" height="11" rx="1.5" fill="#6B4A52" stroke="none" /><path d="M22 31 v11 M27 31 v11 M17 36.5 h16" stroke="#8E6870" strokeWidth={1} /><path d="M40 32 q6 -2 6 5 q-1 6 -6 7 q-5 -1 -6 -7 q0 -7 6 -5 z" fill="#E36A80" stroke="none" /><path d="M37 31 l3 2 l3 -2" stroke="#9DB899" strokeWidth={1.8} fill="none" strokeLinecap="round" /></>),
  pudding: (<>{bowl}<path d="M12 32 q20 -8 40 0" fill="#7A5560" stroke="none" /><circle cx="26" cy="29" r="1.6" fill="#3E2A30" stroke="none" /><circle cx="33" cy="28" r="1.6" fill="#3E2A30" stroke="none" /><circle cx="39" cy="30" r="1.6" fill="#3E2A30" stroke="none" /></>),
  froyo: (<><rect x="23" y="12" width="18" height="30" rx="8" fill="#7A5560" stroke="var(--rose-deep)" strokeWidth={1.4} /><path d="M26 22 q6 -3 12 0" stroke="#A5838B" strokeWidth={1.4} fill="none" /><rect x="30" y="42" width="4" height="12" rx="2" fill="#EBD3A6" stroke="none" /></>),
  cookies: (<>{plate}<circle cx="25" cy="35" r="9" fill="#E9C38E" stroke="var(--rose-deep)" strokeWidth={1.2} /><circle cx="40" cy="38" r="8" fill="#E9C38E" stroke="var(--rose-deep)" strokeWidth={1.2} /><circle cx="22" cy="33" r="1.5" fill="#5B3D33" /><circle cx="27" cy="38" r="1.5" fill="#5B3D33" /><circle cx="28" cy="31" r="1.2" fill="#5B3D33" /><circle cx="38" cy="36" r="1.4" fill="#5B3D33" /><circle cx="43" cy="40" r="1.4" fill="#5B3D33" /></>),
  custom: (<>{plate}<path d="M32 30 c-3 -5 -10 -2 -8 3 c1 3 8 7 8 7 c0 0 7 -4 8 -7 c2 -5 -5 -8 -8 -3 z" fill="var(--blush)" stroke="var(--rose-deep)" strokeWidth={1.4} /></>)
};

export function FoodArt({ art, size = 56 }: { art: string; size?: number }) {
  return (
    <div className="shrink-0 rounded-2xl bg-petal grid place-items-center" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 64 64" width={size * 0.9} height={size * 0.9}>{ART[art] ?? ART.custom}</svg>
    </div>
  );
}

// ---------- exercise figures ----------
const P = { fill: 'none', stroke: 'var(--rose-deep)', strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const head = (x: number, y: number) => <circle cx={x} cy={y} r={6} fill="var(--petal)" stroke="var(--rose-deep)" strokeWidth={3} />;
const FIG: Record<string, JSX.Element> = {
  squat: (<>{head(50, 26)}<path d="M50 33 L46 56 L62 68 L60 88 M46 56 L36 72 L42 88 M48 40 L72 46" {...P} /><path d="M18 60 h22 v28 M18 60 v28" stroke="var(--blush)" strokeWidth={3} fill="none" strokeLinecap="round" /></>),
  pushup: (<><path d="M84 12 v80" stroke="var(--blush)" strokeWidth={4} strokeLinecap="round" />{head(60, 28)}<path d="M58 35 L44 62 L40 90 M44 62 L48 90 M56 42 L70 44 L82 36" {...P} /></>),
  hinge: (<>{head(38, 30)}<path d="M43 34 L62 48 L60 70 L62 90 M60 70 L56 90 M50 42 L52 52" {...P} /></>),
  knee: (<>{head(50, 20)}<path d="M50 27 L50 56 L44 90 M50 56 L64 62 L60 78 M50 32 L40 22 M50 32 L60 44 L62 58" {...P} /></>),
  march: (<>{head(50, 18)}<path d="M50 25 L50 56 L46 90 M50 56 L62 64 L60 80 M50 32 L38 46 M50 32 L62 22" {...P} /></>),
  warmup: (<>{head(50, 20)}<path d="M50 27 L50 58 L42 90 M50 58 L58 90 M50 34 L30 22 M50 34 L70 22" {...P} /><path d="M24 14 a8 8 0 1 0 6 -4 M76 14 a8 8 0 1 1 -6 -4" stroke="var(--blush)" strokeWidth={2.4} fill="none" strokeLinecap="round" /></>),
  cooldown: (<>{head(50, 22)}<path d="M50 29 L50 60 L36 90 M50 60 L64 90 M50 36 L40 10 M50 36 L60 10" {...P} /></>),
  rest: (<><circle cx="50" cy="50" r="26" fill="var(--petal)" stroke="var(--blush)" strokeWidth={3} /><path d="M40 52 q10 10 20 0" {...P} /><path d="M40 44 h4 M56 44 h4" {...P} /></>),
  bike: (<><circle cx="26" cy="74" r="14" {...P} stroke="var(--blush)" /><circle cx="76" cy="74" r="14" {...P} stroke="var(--blush)" /><path d="M26 74 L46 50 L70 50 L76 74 M46 50 L52 74 L70 50" stroke="var(--blush)" strokeWidth={3} fill="none" />{head(52, 18)}<path d="M52 25 L46 46 L58 62 M46 46 L66 46 L74 42 M50 32 L70 40" {...P} /></>),
  walk: (<>{head(50, 18)}<path d="M50 25 L48 56 L36 88 M48 56 L62 70 L66 88 M50 32 L36 48 M50 32 L64 46" {...P} /></>)
};

export function ExerciseArt({ id, size = 120 }: { id?: string; size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      {FIG[id ?? 'walk'] ?? FIG.walk}
    </svg>
  );
}
