'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  THEME_DATA,
  THEME_ORDER,
  useTheme,
} from '@/frontend/context/ThemeContext'
import { useAuth } from '@/frontend/context/AuthContext'
import { NAV_LINKS } from '@/frontend/lib/constants'
import {
  FACTION_META,
  resolvePostAuthPath,
  toPrivateFactionRouteId,
} from '@/frontend/lib/launch'
import { AngoUsername } from '@/frontend/components/ango/AngoUsername'
import styles from './Nav.module.css'
import SoundToggle from './SoundToggle'
import NotificationBell from './NotificationBell'
import { createClient as createSupabaseClient } from '@/frontend/lib/supabase/client'

const MOBILE_THEME_META = {
  light: 'Agency hours',
  neutral: 'Guild hours',
  dark: 'Mafia hours',
} as const

export function Nav() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme, resetThemeToAuto, isAutoTheme, currentTimeLabel } = useTheme()
  const { user, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingDuelChallenges, setPendingDuelChallenges] = useState(0)
  const activeProfile = profile
  const factionMeta = activeProfile?.faction ? FACTION_META[activeProfile.faction] : null
  const isAngoOperator =
    user && activeProfile?.role === 'mod' && activeProfile.faction === 'special_div'
  const privateFactionHref =
    activeProfile?.faction &&
      (activeProfile.role === 'member' ||
        activeProfile.role === 'mod' ||
        activeProfile.role === 'owner')
      ? `/faction/${toPrivateFactionRouteId(activeProfile.faction)}`
      : null
  const profileHref = activeProfile
    ? `/profile/${activeProfile.username}`
    : resolvePostAuthPath(activeProfile)
  const accountStyle = factionMeta
    ? ({ '--account-accent': factionMeta.color } as CSSProperties)
    : undefined
  const mobileFactionLabel = factionMeta ? `${factionMeta.name} Room` : 'Faction Room'

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!user) {
      setPendingDuelChallenges(0)
      return
    }

    // Load once on mount, then update in real-time via Supabase channel
    const supabase = createSupabaseClient()
    let active = true

    const load = async () => {
      const response = await fetch('/api/notifications?limit=20', { cache: 'no-store' })
      const json = await response.json().catch(() => ({}))
      if (!active) return
      const rows = response.ok && Array.isArray(json.data) ? json.data : []
      const count = rows.filter(
        (item: { type?: string; read_at?: string | null }) =>
          item.type === 'duel_challenge' && !item.read_at,
      ).length
      setPendingDuelChallenges(count)
    }

    void load()

    const channel = supabase
      .channel(`nav-duel-count:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => { void load() },
      )
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [user])

  return (
    <>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <div className={styles.brandEmblem}>
            <svg className={styles.rainMark} viewBox="0 0 42 42" aria-hidden="true">
              <line x1="11" y1="6" x2="8" y2="18" stroke="currentColor" strokeWidth="1" />
              <line x1="21" y1="2" x2="18" y2="16" stroke="currentColor" strokeWidth="1" />
              <line x1="31" y1="8" x2="28" y2="22" stroke="currentColor" strokeWidth="1" />
            </svg>
            <span className={styles.brandKanji}>B</span>
          </div>
          <div className={styles.brandCopy}>
            <span className={styles.brandTitle}>
              Bungou<span className={styles.brandTitleAccent}>Archive</span>
            </span>
            <span className={styles.brandSubtitle}>A record of Yokohama&apos;s ability users</span>
          </div>
        </Link>

        <ul className={styles.links}>
          {NAV_LINKS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <li key={item.href} className={styles.linkItem}>
                <Link
                  href={item.href}
                  onMouseEnter={() => router.prefetch(item.href)}
                  className={`${styles.link} ${active ? styles.linkActive : ''}`}
                >
                  {item.label}
                  {item.href === '/duels' && pendingDuelChallenges > 0 ? ` | ${pendingDuelChallenges}` : ''}
                </Link>
              </li>
            )
          })}
          {privateFactionHref && factionMeta ? (
            <li className={styles.linkItem}>
              <Link
                href={privateFactionHref}
                onMouseEnter={() => router.prefetch(privateFactionHref)}
                className={`${styles.link} ${styles.factionLink} ${pathname === privateFactionHref || pathname.startsWith(`${privateFactionHref}/`)
                  ? styles.linkActive
                  : ''
                  }`}
                style={{ '--faction-link-color': factionMeta.color } as CSSProperties}
              >
                {factionMeta.kanji}
              </Link>
            </li>
          ) : null}
        </ul>

        <div className={styles.right}>
          {user && activeProfile ? (
            <Link href={profileHref} className={styles.accountLink} style={accountStyle}>
              <span className={styles.accountSeal}>{factionMeta?.kanji ?? 'B'}</span>
              <span className={styles.accountHandle}>
                <AngoUsername userId={activeProfile.id} username={activeProfile.username} />
              </span>
            </Link>
          ) : null}

          {user ? <NotificationBell userId={user.id} /> : null}
          <SoundToggle />

          <div className={styles.themeDock}>
            <button
              type="button"
              onClick={resetThemeToAuto}
              className={`${styles.cityModeButton} ${isAutoTheme ? styles.cityModeButtonActive : ''
                }`}
              title="Use Yokohama time"
            >
              <span className={styles.cityModeLabel}>City</span>
              <span className={styles.cityModeMeta} suppressHydrationWarning>
                Auto | {currentTimeLabel}
              </span>
            </button>

            <div className={styles.themeLanterns}>
              {THEME_ORDER.map((themeKey) => (
                <button
                  key={themeKey}
                  type="button"
                  onClick={() => setTheme(themeKey)}
                  className={`${styles.lanternButton} ${theme === themeKey ? styles.lanternButtonActive : ''
                    } ${isAutoTheme ? styles.lanternButtonAuto : ''}`}
                  title={`Switch to ${THEME_DATA[themeKey].label}`}
                >
                  <span className={styles.lanternGlyph}>{THEME_DATA[themeKey].glyph}</span>
                  <span className={styles.lanternLabel}>{THEME_DATA[themeKey].label}</span>
                </button>
              ))}
            </div>
          </div>

          {user && activeProfile?.role === 'owner' ? (
            <Link href="/owner" className={styles.ownerLink}>
              owner
            </Link>
          ) : null}

          {isAngoOperator ? (
            <Link href="/admin/special-division" className={styles.ownerLink}>
              ango
            </Link>
          ) : null}

          {user ? (
            <button onClick={signOut} className={styles.signOut}>
              out
            </button>
          ) : (
            <Link href="/login" className={styles.enterLink}>
              Enter
            </Link>
          )}

          <button
            type="button"
            className={`${styles.menuButton} ${menuOpen ? styles.menuButtonActive : ''}`}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
            onClick={() => setMenuOpen((current) => !current)}
          >
            Menu
          </button>
        </div>
      </nav>

      <button
        type="button"
        aria-hidden={!menuOpen}
        tabIndex={menuOpen ? 0 : -1}
        className={`${styles.mobileBackdrop} ${menuOpen ? styles.mobileBackdropOpen : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      <aside
        id="mobile-nav-panel"
        className={`${styles.mobilePanel} ${menuOpen ? styles.mobilePanelOpen : ''}`}
      >
        <div className={styles.mobileSection}>
          <span className={styles.mobileSectionLabel}>Navigate</span>
          <div className={styles.mobileLinkList}>
            {NAV_LINKS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.mobileLink} ${active ? styles.mobileLinkActive : ''}`}
                >
                  {item.label}
                  {item.href === '/duels' && pendingDuelChallenges > 0 ? ` | ${pendingDuelChallenges}` : ''}
                </Link>
              )
            })}

            {privateFactionHref ? (
              <Link
                href={privateFactionHref}
                className={`${styles.mobileLink} ${pathname === privateFactionHref || pathname.startsWith(`${privateFactionHref}/`)
                  ? styles.mobileLinkActive
                  : ''
                  }`}
                style={
                  factionMeta
                    ? ({ '--mobile-link-accent': factionMeta.color } as CSSProperties)
                    : undefined
                }
              >
                {mobileFactionLabel}
              </Link>
            ) : null}

            {user && activeProfile ? (
              <Link href={profileHref} className={styles.mobileLink}>
                Profile
              </Link>
            ) : null}
          </div>
        </div>

        <div className={styles.mobileSection}>
          <span className={styles.mobileSectionLabel}>Theme</span>
          <button
            type="button"
            onClick={resetThemeToAuto}
            className={`${styles.mobileCityMode} ${isAutoTheme ? styles.mobileCityModeActive : ''
              }`}
          >
            <span>City</span>
            <span suppressHydrationWarning>{THEME_DATA[theme].label} | {currentTimeLabel}</span>
          </button>

          <div className={styles.mobileLanterns}>
            {THEME_ORDER.map((themeKey) => (
              <button
                key={themeKey}
                type="button"
                onClick={() => setTheme(themeKey)}
                className={`${styles.mobileLanternButton} ${theme === themeKey ? styles.mobileLanternButtonActive : ''
                  }`}
              >
                <span className={styles.lanternGlyph}>{THEME_DATA[themeKey].glyph}</span>
                <span className={styles.mobileLanternCopy}>
                  <span className={styles.mobileLanternLabel}>{THEME_DATA[themeKey].label}</span>
                  <span className={styles.mobileLanternMeta}>
                    {MOBILE_THEME_META[themeKey]}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.mobileActions}>
          {user && activeProfile?.role === 'owner' ? (
            <Link href="/owner" className={styles.mobileActionLink}>
              owner
            </Link>
          ) : null}

          {isAngoOperator ? (
            <Link href="/admin/special-division" className={styles.mobileActionLink}>
              ango
            </Link>
          ) : null}

          {user ? (
            <button onClick={signOut} className={styles.mobileActionButton}>
              out
            </button>
          ) : (
            <Link href="/login" className={styles.mobileActionLink}>
              Enter
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}
