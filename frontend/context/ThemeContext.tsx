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
    labelJp: 'Yoake',
    glyph: 'o',
    eyebrow: 'Dawn | Agency Hours | Yoake',
    quote:
      '"No matter how many mistakes you make, you are still ahead of everyone who is not trying."',
    attr: 'Doppo Kunikida',
    heroKanji: 'Bungo',
  },
  neutral: {
    label: 'Twilight',
    labelJp: 'Tasogare',
    glyph: 'O',
    eyebrow: 'Twilight | Neutral Hours | Tasogare',
    quote:
      '"The world belongs to those willing to pay the price. I simply know my worth."',
    attr: 'Francis Scott Key Fitzgerald',
    heroKanji: 'Dusk',
  },
  dark: {
    label: 'Midnight',
    labelJp: 'Shinya',
    glyph: '@',
    eyebrow: 'Midnight | Mafia Hours | Shinya',
    quote:
      '"Humans are foolish creatures. They seek strength, then break beneath it."',
    attr: 'Ryunosuke Akutagawa',
    heroKanji: 'Night',
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
  currentTimeLabel: '--:--',
  currentThemeNameJp: THEME_DATA.light.labelJp,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto')
  const [isFlashing, setFlashing] = useState(false)
  const [currentTimeLabel, setCurrentTimeLabel] = useState('--:--')
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
    const storedMode = localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null
    const storedTheme = localStorage.getItem(THEME_OVERRIDE_KEY) as Theme | null
    const now = new Date()

    setCurrentTimeLabel(formatTime(now))

    if (
      storedMode === 'manual' &&
      storedTheme &&
      ['light', 'neutral', 'dark'].includes(storedTheme)
    ) {
      setThemeMode('manual')
      applyTheme(storedTheme, false)
      return
    }

    setThemeMode('auto')
    applyTheme(getTimeTheme(now), false)
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
      setThemeMode('manual')
      localStorage.setItem(THEME_MODE_KEY, 'manual')
      localStorage.setItem(THEME_OVERRIDE_KEY, nextTheme)
      applyTheme(nextTheme, true)
    },
    [applyTheme],
  )

  const resetThemeToAuto = useCallback(() => {
    const nextTheme = getTimeTheme()
    setThemeMode('auto')
    localStorage.setItem(THEME_MODE_KEY, 'auto')
    localStorage.removeItem(THEME_OVERRIDE_KEY)
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
