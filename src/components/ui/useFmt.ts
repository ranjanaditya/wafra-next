import { useMemo } from 'react';
import { useLang } from '../../i18n';
import * as F from '../../lib/format';

/** Language-bound formatters: `const f = useFmt(); f.sarM(201)` → "SAR 201m" / "201 مليون ر.س". */
export function useFmt() {
  const lang = useLang();
  return useMemo(
    () => ({
      lang,
      num: F.num,
      int: (n: number) => F.int(n, lang),
      sar: (n: number, dp = 0) => F.sar(n, lang, dp),
      sarM: (n: number, dp = 0) => F.sarM(n, lang, dp),
      sarBn: (n: number, dp = 1) => F.sarBn(n, lang, dp),
      mill: (n: number, dp = 2) => F.mill(n, lang, dp),
      pct: (n: number, dp = 1) => F.pct(n, dp, lang),
      pp: (n: number, dp = 1) => F.pp(n, dp, lang),
      paren: (n: number, dp = 0) => F.paren(n, dp, lang),
      signed: (n: number, dp = 1) => (lang === 'ar' ? F.iso(F.signed(n, dp)) : F.signed(n, dp)),
      fy: (s: string) => F.fy(s, lang),
      monthYear: (y: number, m0: number) => F.monthYear(y, m0, lang),
    }),
    [lang],
  );
}
export type Fmt = ReturnType<typeof useFmt>;
