// Starting estimates only (Mifflin-St Jeor). Always editable; never lowered automatically.
export function suggestTargets(p: { sex: 'female' | 'male' | 'other'; age: number; heightIn: number; weightLb: number; goalLb: number; activity: 'sedentary' | 'light' | 'moderate' }) {
  const kg = p.weightLb * 0.4536, cm = p.heightIn * 2.54;
  const base = 10 * kg + 6.25 * cm - 5 * p.age;
  const bmr = p.sex === 'male' ? base + 5 : p.sex === 'female' ? base - 161 : base - 78;
  const factor = { sedentary: 1.2, light: 1.375, moderate: 1.55 }[p.activity];
  const tdee = bmr * factor;
  const floor = p.sex === 'male' ? 1500 : 1300;
  const losing = p.goalLb < p.weightLb - 0.5;
  const deficit = losing ? Math.min(500, tdee * 0.2) : 0;
  const cal = Math.max(floor, Math.round((tdee - deficit) / 50) * 50);
  const ref = losing ? p.goalLb : p.weightLb;
  const r5 = (n: number) => Math.round(n / 5) * 5;
  return { cal, calMin: cal - 50, calMax: cal + 100, proteinMin: r5(ref * 0.75), proteinMax: r5(ref * 0.9), tdee: Math.round(tdee) };
}
