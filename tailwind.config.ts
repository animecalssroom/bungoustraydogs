import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './frontend/app/**/*.{js,ts,jsx,tsx,mdx}',
    './frontend/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // We use data-theme attribute, not class — so darkMode is irrelevant here
  // Theme switching is handled via CSS custom properties on [data-theme]
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      // ── Fonts ──
      fontFamily: {
        cinzel:     ['Cinzel', 'serif'],
        cormorant:  ['Cormorant Garamond', 'serif'],
        noto:       ['Noto Serif JP', 'serif'],
        mono:       ['Space Mono', 'monospace'],
        fell:       ['IM Fell English', 'serif'],
      },

      // ── Colors — all map to CSS variables ──
      // Usage in JSX: className="bg-surface text-primary border-border"
      colors: {
        bg:        'var(--bg)',
        bg2:       'var(--bg2)',
        bg3:       'var(--bg3)',
        bg4:       'var(--bg4)',
        surface:   'var(--surface)',
        surface2:  'var(--surface2)',
        border:    'var(--border)',
        border2:   'var(--border2)',
        primary:   'var(--text)',
        text2:     'var(--text2)',
        text3:     'var(--text3)',
        text4:     'var(--text4)',
        accent:    'var(--accent)',
        accent2:   'var(--accent2)',
        accent3:   'var(--accent3)',
        tag:       'var(--tag)',
        nav:       'var(--nav)',
        card:      'var(--card)',
      },

      // ── Box shadows — use glow variable ──
      boxShadow: {
        glow:   '0 8px 32px var(--glow)',
        glow2:  '0 16px 48px var(--glow)',
        card:   '0 2px 12px var(--glow)',
      },

      // ── Border radius ──
      borderRadius: {
        none: '0px',
      },

      // ── Custom clip paths ──
      clipPath: {
        btn:  'polygon(0 0, calc(100% - 9px) 0, 100% 9px, 100% 100%, 9px 100%, 0 calc(100% - 9px))',
        btnS: 'polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px))',
      },

      // ── Animations ──
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(22px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        pdrift: {
          '0%':   { transform: 'translateY(100vh) rotate(0deg)', opacity: '0' },
          '10%':  { opacity: '0.7' },
          '90%':  { opacity: '0.4' },
          '100%': { transform: 'translateY(-40px) rotate(720deg)', opacity: '0' },
        },
        borderGrow: {
          from: { height: '0%' },
          to:   { height: '100%' },
        },
        inkDrop: {
          '0%':   { transform: 'scale(0)', opacity: '0.08' },
          '100%': { transform: 'scale(30)', opacity: '0' },
        },
        statFill: {
          from: { width: '0%' },
          to:   { width: 'var(--stat-width)' },
        },
      },
      animation: {
        'fade-up':      'fadeUp 0.9s ease both',
        'fade-up-d1':   'fadeUp 0.9s ease 0.1s both',
        'fade-up-d2':   'fadeUp 0.9s ease 0.2s both',
        'fade-up-d3':   'fadeUp 0.9s ease 0.3s both',
        'fade-up-d4':   'fadeUp 0.9s ease 0.5s both',
        'fade-up-d5':   'fadeUp 0.9s ease 0.7s both',
        'fade-up-d6':   'fadeUp 0.9s ease 0.9s both',
        'fade-in':      'fadeIn 0.7s ease both',
        'p-drift':      'pdrift linear infinite',
        'ink-drop':     'inkDrop 0.6s ease forwards',
        'stat-fill':    'statFill 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },

      // ── Transitions ──
      transitionDuration: {
        '400': '400ms',
        '700': '700ms',
      },
    },
  },
  plugins: [
    // Custom plugin: clip-path utility
    function({ addUtilities }: { addUtilities: (u: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.clip-btn': {
          'clip-path': 'polygon(0 0, calc(100% - 9px) 0, 100% 9px, 100% 100%, 9px 100%, 0 calc(100% - 9px))',
        },
        '.clip-btn-sm': {
          'clip-path': 'polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px))',
        },
        '.writing-vertical': {
          'writing-mode': 'vertical-rl',
        },
        '.writing-horizontal': {
          'writing-mode': 'horizontal-tb',
        },
        '.text-stroke-thin': {
          '-webkit-text-stroke': '1px currentColor',
        },
        '.noise-overlay': {
          'background-image': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.03'/%3E%3C/svg%3E\")",
        },
      })
    },
  ],
}

export default config