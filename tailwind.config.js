/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        elev: v('elev'),
        surface: v('surface'),
        ink: v('text'),
        muted: v('muted'),
        line: v('line'),
        brand: { DEFAULT: v('brand'), hover: v('brand-hover'), deep: v('brand-deep') },
        gold: v('gold'),
        ai: { DEFAULT: v('ai'), glow: v('ai-glow') },
        pass: v('pass'),
        watch: v('watch'),
        stop: v('stop'),
      },
      fontFamily: {
        display: ['Sora', 'IBM Plex Sans Arabic', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        arabic: ['IBM Plex Sans Arabic', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        caption: ['0.8125rem', { lineHeight: '1.15rem' }],
        body: ['1rem', { lineHeight: '1.55rem' }],
        h4: ['1.25rem', { lineHeight: '1.7rem', letterSpacing: '-0.01em' }],
        h3: ['1.75rem', { lineHeight: '2.2rem', letterSpacing: '-0.02em' }],
        h2: ['2.5rem', { lineHeight: '2.9rem', letterSpacing: '-0.02em' }],
        hero: ['4.5rem', { lineHeight: '4.6rem', letterSpacing: '-0.02em' }],
      },
      borderRadius: { card: '24px', inner: '16px' },
      maxWidth: { shell: '1280px' },
      transitionTimingFunction: { out: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      boxShadow: {
        soft: '0 1px 0 rgb(255 255 255 / 0.04) inset, 0 12px 32px -12px rgb(0 0 0 / 0.55), 0 2px 6px -2px rgb(0 0 0 / 0.35)',
        glow: '0 0 0 1px rgb(var(--brand) / 0.35), 0 10px 40px -10px rgb(var(--brand) / 0.55)',
        aiglow: '0 0 0 1px rgb(var(--ai) / 0.4), 0 10px 40px -12px rgb(var(--ai) / 0.6)',
        goldglow: '0 0 0 1px rgb(var(--gold) / 0.45), 0 10px 36px -12px rgb(var(--gold) / 0.55)',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '200% 50%' }, '100%': { backgroundPosition: '-200% 50%' } },
        pulseRing: { '0%': { transform: 'scale(0.9)', opacity: '0.7' }, '100%': { transform: 'scale(1.9)', opacity: '0' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '20%': { transform: 'translateX(-6px)' }, '40%': { transform: 'translateX(6px)' }, '60%': { transform: 'translateX(-4px)' }, '80%': { transform: 'translateX(4px)' } },
        drift: { '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' }, '50%': { transform: 'translate3d(4%, -3%, 0) scale(1.08)' } },
        drift2: { '0%,100%': { transform: 'translate3d(0,0,0) scale(1.05)' }, '50%': { transform: 'translate3d(-5%, 4%, 0) scale(0.95)' } },
        blink: { '0%,80%,100%': { opacity: '0.25' }, '40%': { opacity: '1' } },
        scan: { '0%': { transform: 'translateY(-40%)' }, '100%': { transform: 'translateY(140%)' } },
      },
      animation: {
        shimmer: 'shimmer 8s linear infinite',
        pulseRing: 'pulseRing 1.6s cubic-bezier(0.22,1,0.36,1) infinite',
        shake: 'shake 0.45s cubic-bezier(0.22,1,0.36,1)',
        drift: 'drift 26s ease-in-out infinite',
        drift2: 'drift2 32s ease-in-out infinite',
        blink: 'blink 1.2s infinite',
        scan: 'scan 2.2s cubic-bezier(0.22,1,0.36,1) infinite',
      },
    },
  },
  plugins: [],
};
