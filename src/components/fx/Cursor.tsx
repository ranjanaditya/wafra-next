import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFxEnabled } from './hooks';
import { useApp } from '../../store';
import { useT } from '../../i18n';

const INTERACTIVE = '[data-cursor], a, button, [role="button"], [role="slider"], [role="tab"], input, select, textarea, label, summary';
type Word = 'open' | 'drag' | 'explain' | 'freeze' | 'play';

/**
 * Custom cursor: an 8px dot plus a 36px ring that follows with lerp 0.15 and
 * mix-blend difference. The ring grows on hover and shows a context word taken
 * from the nearest [data-cursor] ("open", "drag", "explain", "freeze", "play").
 */
export function Cursor() {
  const enabled = useFxEnabled();
  const presenter = useApp((s) => s.presenter);
  const t = useT();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [word, setWord] = useState<Word | null>(null);
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add('custom-cursor');
    let tx = -100;
    let ty = -100;
    let rx = -100;
    let ry = -100;
    let raf = 0;
    const move = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      tx = e.clientX;
      ty = e.clientY;
      setVisible(true);
      if (dot.current) dot.current.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%)`;
    };
    const over = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest?.(INTERACTIVE) ?? null;
      setHover(!!el);
      const w = el?.closest('[data-cursor]')?.getAttribute('data-cursor') as Word | null;
      setWord(w && ['open', 'drag', 'explain', 'freeze', 'play'].includes(w) ? w : null);
    };
    const loop = () => {
      rx += (tx - rx) * 0.15;
      ry += (ty - ry) * 0.15;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const leave = () => setVisible(false);
    const pd = () => setDown(true);
    const pu = () => setDown(false);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over, { passive: true });
    window.addEventListener('pointerdown', pd, { passive: true });
    window.addEventListener('pointerup', pu, { passive: true });
    document.addEventListener('mouseleave', leave);
    return () => {
      root.classList.remove('custom-cursor');
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      window.removeEventListener('pointerdown', pd);
      window.removeEventListener('pointerup', pu);
      document.removeEventListener('mouseleave', leave);
    };
  }, [enabled]);

  if (!enabled) return null;
  const base = presenter ? 52 : 36;
  const size = word ? base * 2.1 : hover ? base * 1.45 : base;
  return createPortal(
    <>
      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[200] mix-blend-difference"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.2s' }}
      >
        <div
          className="flex items-center justify-center rounded-full border-[1.5px] border-white"
          style={{
            width: size,
            height: size,
            background: word ? '#fff' : 'transparent',
            transform: `scale(${down ? 0.85 : 1})`,
            transition: 'width .35s cubic-bezier(.22,1,.36,1), height .35s cubic-bezier(.22,1,.36,1), background-color .25s, transform .2s',
          }}
        >
          {word && (
            <span className="select-none text-[11px] font-semibold uppercase tracking-[0.12em] text-black">{t.common.cursor[word]}</span>
          )}
        </div>
      </div>
      <div
        ref={dot}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[201] h-2 w-2 rounded-full bg-white mix-blend-difference"
        style={{ opacity: visible && !word ? 1 : 0, transition: 'opacity 0.2s' }}
      />
    </>,
    document.body,
  );
}
