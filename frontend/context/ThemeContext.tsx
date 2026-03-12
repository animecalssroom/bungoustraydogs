'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

export type Theme = 'light' | 'neutral' | 'dark'
type ThemeMode = 'auto' | 'manual'

export const THEME_ORDER: Theme[] = ['light', 'neutral', 'dark']

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  resetThemeToAuto: () => void
  isAutoTheme: boolean
  isFlashing: boolean
  currentTimeLabel: string
  currentThemeNameJp: string
}

export const THEME_DATA: Record<
  Theme,
  {
    label: string
    labelJp: string
    glyph: string
    eyebrow: string
    quote: string
    attr: string
    heroKanji: string
  }
> = {
  light: {
    label: 'Dawn',
    labelJp: '夜明け',
    glyph: '◷',
    eyebrow: '夜明け · Dawn · Agency Hours',
    quote:
      '"No matter how many mistakes you make, you are still ahead of everyone who is not trying."',
    attr: 'Doppo Kunikida · 国木田独歩',
    heroKanji: '文豪',
  },
  neutral: {
    label: 'Twilight',
    labelJp: '黄昏',
    glyph: '◐',
    eyebrow: '黄昏 · Twilight · Neutral Hours',
    quote:
      '"The world belongs to those willing to pay the price. I simply know my worth."',
    attr: 'Francis Scott Key Fitzgerald · フィッツジェラルド',
    heroKanji: '黄昏',
  },
  dark: {
    label: 'Midnight',
    labelJp: '深夜',
    glyph: '◑',
    eyebrow: '深夜 · Midnight · Mafia Hours',
    quote:
      '"Humans are foolish creatures. They seek strength, then break beneath it."',
    attr: 'Ryunosuke Akutagawa · 芥川龍之介',
    heroKanji: '暗黒',
  },
}

const THEME_MODE_KEY = 'bsd-theme-mode'
const THEME_OVERRIDE_KEY = 'bsd-theme'

function getTimeTheme(date = new Date()): Theme {
  const hour = date.getHours()

  if (hour >= 6 && hour < 14) {
    return 'light'
  }

  if (hour >= 14 && hour < 20) {
    return 'neutral'
  }

  return 'dark'
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  resetThemeToAuto: () => {},
  isAutoTheme: true,
  isFlashing: false,
  currentTimeLabel: '',
  currentThemeNameJp: THEME_DATA.light.labelJp,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto')
  const [isFlashing, setFlashing] = useState(false)
  const [currentTimeLabel, setCurrentTimeLabel] = useState(formatTime())
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const applyTheme = useCallback((nextTheme: Theme, animate = true) => {
    document.documentElement.setAttribute('data-theme', nextTheme)
    setThemeState(nextTheme)

    if (animate) {
      if (flashTimer.current) {
        clearTimeout(flashTimer.current)
      }

      setFlashing(true)
      flashTimer.current = setTimeout(() => setFlashing(false), 180)
    }
  }, [])

  useEffect(() => {
    const savedMode = localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null
    const savedTheme = localStorage.getItem(THEME_OVERRIDE_KEY) as Theme | null

    if (savedMode === 'manual' && savedTheme && THEME_DATA[savedTheme]) {
      setThemeMode('manual')
      applyTheme(savedTheme, false)
      return
    }

    const nextTheme = getTimeTheme()
    setThemeMode('auto')
    localStorage.setItem(THEME_MODE_KEY, 'auto')
    applyTheme(nextTheme, false)
  }, [applyTheme])

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = new Date()
      setCurrentTimeLabel(formatTime(now))

      if (themeMode === 'auto') {
        applyTheme(getTimeTheme(now), false)
      }
    }, 60 * 1000)

    return () => window.clearInterval(interval)
  }, [applyTheme, themeMode])

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      localStorage.setItem(THEME_MODE_KEY, 'manual')
      localStorage.setItem(THEME_OVERRIDE_KEY, nextTheme)
      setThemeMode('manual')
      applyTheme(nextTheme, true)
    },
    [applyTheme],
  )

  const resetThemeToAuto = useCallback(() => {
    localStorage.setItem(THEME_MODE_KEY, 'auto')
    localStorage.removeItem(THEME_OVERRIDE_KEY)
    const nextTheme = getTimeTheme()
    setThemeMode('auto')
    applyTheme(nextTheme, true)
  }, [applyTheme])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resetThemeToAuto,
      isAutoTheme: themeMode === 'auto',
      isFlashing,
      currentTimeLabel,
      currentThemeNameJp: THEME_DATA[theme].labelJp,
    }),
    [currentTimeLabel, isFlashing, resetThemeToAuto, setTheme, theme, themeMode],
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <div className={`theme-flash ${isFlashing ? 'active' : ''}`} aria-hidden="true" />
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export const ANTI_FOUC_SCRIPT = `
(function() {
  try {
    var mode = localStorage.getItem('${THEME_MODE_KEY}');
    var saved = localStorage.getItem('${THEME_OVERRIDE_KEY}');
    var hour = new Date().getHours();
    var autoTheme = hour >= 6 && hour < 14 ? 'light' : (hour >= 14 && hour < 20 ? 'neutral' : 'dark');
    var nextTheme = mode === 'manual' && (saved === 'light' || saved === 'neutral' || saved === 'dark')
      ? saved
      : autoTheme;
    document.documentElement.setAttribute('data-theme', nextTheme);
  } catch (e) {}
})();
`
