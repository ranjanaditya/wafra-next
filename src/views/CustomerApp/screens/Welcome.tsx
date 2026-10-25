import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useApp } from '../../../store';
import { useLang, useT } from '../../../i18n';
import { BRAND, PERSONA_ORDER, PERSONAS } from '../../../config/illustrative';
import { Avatar } from '../../../components/ui/Controls';
import { Illus } from '../../../components/ui/Provenance';
import { useFmt } from '../../../components/ui/useFmt';
import { Monogram } from '../../../components/shell/TopNav';
import { pickPersona } from '../../../logic/journey';
import { cn } from '../../../lib/cn';

export function Welcome() {
  const t = useT();
  const lang = useLang();
  const f = useFmt();
  const setLang = useApp((s) => s.setLang);
  return (
    <div className="flex min-h-full flex-col">
      <div className="relative mb-5 mt-2 overflow-hidden rounded-[22px] border border-line/10 p-5" style={{ background: 'radial-gradient(130% 120% at 0% 0%, rgb(var(--brand) / 0.28), transparent 60%), rgb(var(--line) / 0.03)' }}>
        <div className="stars absolute inset-0 !opacity-[0.06]" />
        <Monogram size={40} className="relative mb-4" />
        <h3 className="relative font-display text-[24px] font-semibold leading-[1.15] tracking-tight">{t.app.welcome.hello}</h3>
        <p className="relative mt-2 text-[13px] leading-[1.5] text-muted">{t.app.welcome.sub}</p>
        <div className="relative mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">{BRAND[lang]}</div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">{t.app.welcome.choose}</span>
        <Illus />
      </div>
      <div className="space-y-2.5">
        {PERSONA_ORDER.map((id, i) => {
          const p = PERSONAS[id];
          return (
            <motion.button
              key={id}
              type="button"
              data-cursor="open"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.05 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => pickPersona(id)}
              className="flex w-full items-center gap-3 rounded-[18px] border border-line/10 bg-line/[0.04] p-3 text-start transition-colors hover:border-gold/40 hover:bg-line/[0.07]"
            >
              <Avatar initials={p.initials} gradient={p.gradient} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[15px] font-semibold">{t.common.personas[id].name}</span>
                  <span className="text-[11.5px] text-muted">
                    {t.common.age.replace('{n}', String(p.age))} · {t.common.cities[p.city]}
                  </span>
                </div>
                <div className="truncate text-[12px] text-muted">{t.common.personas[id].role}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[11.5px]">
                  <span className="num font-semibold text-ink/90">{t.app.welcome.salaryLine.replace('{amount}', f.sar(p.salary))}</span>
                  <span className={cn('rounded-full px-1.5 py-[1px] text-[10px] font-semibold', p.incomeType === 'fixed' ? 'bg-pass/15 text-pass' : 'bg-watch/15 text-watch')}>
                    {t.common.incomeType[p.incomeType]}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted rtl:-scale-x-100" />
            </motion.button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between rounded-[16px] border border-line/10 bg-line/[0.03] px-3 py-2.5">
        <span className="text-[12.5px] text-muted">{t.app.welcome.language}</span>
        <div className="flex rounded-full bg-line/10 p-0.5 text-[12px] font-semibold">
          {(['en', 'ar'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={cn('rounded-full px-3 py-1 transition-colors', lang === l ? 'bg-ink text-bg' : 'text-muted')}
              style={{ fontFamily: l === 'ar' ? 'IBM Plex Sans Arabic' : 'Inter' }}
            >
              {l === 'en' ? 'English' : 'عربي'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
