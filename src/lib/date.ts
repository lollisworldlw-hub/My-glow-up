// All dates are local calendar dates stored as "YYYY-MM-DD".
const pad = (n: number) => String(n).padStart(2, '0');

export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => toKey(new Date());
export const fromKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // noon avoids DST edge cases
};
export const addDays = (k: string, n: number) => {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
};
export const weekday = (k: string) => fromKey(k).getDay(); // 0 = Sunday
/** Monday of the week containing k */
export const weekStart = (k: string) => {
  const wd = weekday(k);
  return addDays(k, wd === 0 ? -6 : 1 - wd);
};
export const weekDays = (mondayKey: string) => Array.from({ length: 7 }, (_, i) => addDays(mondayKey, i));
export const daysBetween = (a: string, b: string) =>
  Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86400000);

export const fmtLong = (k: string) =>
  fromKey(k).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
export const fmtShort = (k: string) =>
  fromKey(k).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
export const fmtDow = (k: string) => fromKey(k).toLocaleDateString(undefined, { weekday: 'short' });
export const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const greeting = (d = new Date()) => {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
