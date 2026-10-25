import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useT } from '../../i18n';
import { cn } from '../../lib/cn';
import { Hero } from './Hero';
import { CHAPTER_IDS, Chapters } from './Chapters';
import './story.css';

/** Vertical chapter rail (portalled: the animated <main> creates a containing block for fixed children). */
function ChapterRail({ active, onJump }: { active: number | null; onJump: (i: number) => void }) {
  const t = useT();
  return createPortal(
    <AnimatePresence>
      {active !== null && (
        <motion.nav
          aria-label={t.story.chapterNavAria}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ y: '-50%' }}
          className="fixed end-3 top-1/2 z-[80] hidden xl:block"
        >
          <ol className="flex flex-col items-end gap-1">
            {t.story.chapters.map((label, i) => {
              const on = i === active;
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => onJump(i)}
                    aria-current={on ? 'step' : undefined}
                    className="group flex items-center gap-2.5 rounded-full py-1.5 ps-2 pe-1"
                  >
                    <span
                      className={cn(
                        'whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium transition-all duration-300',
                        on
                          ? 'bg-line/10 text-ink opacity-100'
                          : 'text-muted opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
                      )}
                    >
                      {label}
                    </span>
                    <span
                      className={cn(
                        'block rounded-full transition-all duration-300',
                        on ? 'h-6 w-1.5 bg-gradient-to-b from-brand to-gold' : 'h-1.5 w-1.5 bg-line/30 group-hover:bg-line/60',
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        </motion.nav>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default function Story() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);

  // Snap scrolling only while the story is on screen.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('story-snap-root');
    return () => root.classList.remove('story-snap-root');
  }, []);

  // Track which chapter crosses the middle of the viewport.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const n = Number(e.target.getAttribute('data-chapter'));
            setActive(n >= 0 ? n : null);
          }
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const jump = useCallback(
    (i: number) => {
      document.getElementById(`story-${CHAPTER_IDS[i]}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    },
    [reduce],
  );

  return (
    <div className="story-root relative">
      <div data-chapter="-1">
        <Hero onScrollStory={() => jump(0)} />
      </div>
      <Chapters />
      <ChapterRail active={active} onJump={jump} />
    </div>
  );
}
