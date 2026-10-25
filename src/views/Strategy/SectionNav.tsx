import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useT } from '../../i18n';
import { cn } from '../../lib/cn';

export const SECTIONS = ['market', 'pools', 'positioning', 'where', 'how', 'roadmap'] as const;
export type SectionId = (typeof SECTIONS)[number];

/** Sticky in-page nav (a–f) so the presenter can jump between sections. */
export function SectionNav() {
  const t = useT().strategy;
  const reduce = useReducedMotion();
  const [active, setActive] = useState<SectionId>('market');

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(`strategy-${s}`)).filter((e): e is HTMLElement => !!e);
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id.replace('strategy-', '') as SectionId);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const go = (id: SectionId) => {
    setActive(id);
    document.getElementById(`strategy-${id}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <nav aria-label={t.navAria} className="sticky top-[4.6rem] z-40 mb-8 flex justify-center">
      <div className="glass flex max-w-full gap-0.5 overflow-x-auto rounded-full p-1 shadow-soft">
        {SECTIONS.map((id) => {
          const on = active === id;
          const letter = t[id].eyebrow.split('·')[0].trim();
          return (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              aria-current={on ? 'location' : undefined}
              className={cn(
                'relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.75rem] font-medium transition-colors',
                on ? 'text-ink' : 'text-muted hover:text-ink',
              )}
            >
              {on && (
                <motion.span
                  layoutId="strategy-section-pill"
                  className="absolute inset-0 rounded-full bg-line/[0.12] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative rounded bg-gold/15 px-1 text-[0.625rem] font-bold uppercase leading-4 text-gold">{letter}</span>
              <span className="relative">{t.nav[id]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
