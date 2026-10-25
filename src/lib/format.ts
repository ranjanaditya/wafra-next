/**
 * Number and currency formatting. Western digits in both languages.
 * English: "SAR 1,057". Arabic: "1,057 ر.س" (numbers isolated so bidi never reorders digits).
 */
export type Lang = 'en' | 'ar';

const LRI = '⁦';
const PDI = '⁩';
const MINUS = '−';

const cache = new Map<number, Intl.NumberFormat>();
function nf(dp: number) {
  let f = cache.get(dp);
  if (!f) {
    f = new Intl.NumberFormat('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
    cache.set(dp, f);
  }
  return f;
}

/** Wrap a numeric run in a left-to-right isolate (invisible). */
export const iso = (s: string) => LRI + s + PDI;

export const num = (n: number, dp = 0) => nf(dp).format(n);

/** Plain number with sign as typographic minus. */
export const numSigned = (n: number, dp = 0) => (n < 0 ? MINUS : '') + num(Math.abs(n), dp);

/** "+38.8" / "−25.9" */
export const signed = (n: number, dp = 1) => (n > 0 ? '+' : n < 0 ? MINUS : '') + num(Math.abs(n), dp);

/** SAR amount: "SAR 8,500" / "8,500 ر.س". */
export function sar(n: number, lang: Lang, dp = 0) {
  const body = numSigned(n, dp);
  return lang === 'ar' ? `${iso(body)} ر.س` : n < 0 ? `${MINUS}SAR ${num(Math.abs(n), dp)}` : `SAR ${body}`;
}

/** SAR millions: "SAR 201m" / "201 مليون ر.س". */
export function sarM(n: number, lang: Lang, dp = 0) {
  const body = numSigned(n, dp);
  return lang === 'ar' ? `${iso(body)} مليون ر.س` : `SAR ${body}m`;
}

/** SAR billions: "SAR 2.3bn" / "2.3 مليار ر.س". */
export function sarBn(n: number, lang: Lang, dp = 1) {
  const body = numSigned(n, dp);
  return lang === 'ar' ? `${iso(body)} مليار ر.س` : `SAR ${body}bn`;
}

/** Millions of people/customers: "0.60m" / "0.60 مليون". */
export function mill(n: number, lang: Lang, dp = 2) {
  const body = numSigned(n, dp);
  return lang === 'ar' ? `${iso(body)} مليون` : `${body}m`;
}

/** Percent: "71.7%". */
export function pct(n: number, dp = 1, lang: Lang = 'en') {
  const s = `${numSigned(n, dp)}%`;
  return lang === 'ar' ? iso(s) : s;
}

/** Percentage points: "+1.8pp". */
export function pp(n: number, dp = 1, lang: Lang = 'en') {
  return lang === 'ar' ? `${iso(signed(n, dp))} نقطة مئوية` : `${signed(n, dp)}pp`;
}

/** P&L style: negatives in parentheses, "(61)". */
export function paren(n: number, dp = 0, lang: Lang = 'en') {
  const s = n < 0 ? `(${num(Math.abs(n), dp)})` : num(n, dp);
  return lang === 'ar' ? iso(s) : s;
}

/** Integer with grouping: "5,081,601". */
export function int(n: number, lang: Lang = 'en') {
  const s = num(n, 0);
  return lang === 'ar' ? iso(s) : s;
}

/** Fiscal-year labels stay Latin in both languages. */
export function fy(label: string, lang: Lang) {
  return lang === 'ar' ? iso(label) : label;
}

/** Month + year for the synthetic journey calendar. */
export function monthYear(year: number, month0: number, lang: Lang) {
  const d = new Date(Date.UTC(year, month0, 15));
  const loc = lang === 'ar' ? 'ar-u-nu-latn-ca-gregory' : 'en-GB';
  return new Intl.DateTimeFormat(loc, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d);
}

export function clock(ts: number) {
  const d = new Date(ts);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const round1 = (v: number) => Math.round(v * 10) / 10;
