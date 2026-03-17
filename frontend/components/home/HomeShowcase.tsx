'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '@/frontend/context/ThemeContext'
import { useAuth } from '@/frontend/context/AuthContext'
import {
  HOME_CHARACTER_FILTERS,
  HOME_CHARACTERS,
  HOME_FACTIONS,
  HOME_LORE_POSTS,
  HOME_THEME_CONTENT,
  RESERVED_SLUGS,
  type HomeCharacterFilter,
} from '@/frontend/lib/home-content'
import { resolvePostAuthPath, toPrivateFactionRouteId } from '@/frontend/lib/launch'
import RainLayer from '@/frontend/components/ui/RainLayer'
import GlobalChat from '@/frontend/components/chat/GlobalChat'
import styles from './HomeShowcase.module.css'

const HOME_QUIZ_PREVIEW = {
  question: 'You have a rare and powerful ability. What is its purpose?',
  options: [
    { id: 'a', text: "To protect people who can't protect themselves" },
    { id: 'b', text: 'To establish your place. Power commands respect' },
    {
      id: 'c',
      text: "It's an asset. Assets generate leverage. Leverage generates everything",
    },
    {
      id: 'd',
      text: "To serve justice without exception. Your ability is the state's weapon",
    },
  ],
} as const

const OPENING_SEQUENCE = [
  { text: 'TERMINAL ONLINE. ESTABLISHING SECURE UPLINK...', delay: 0.2, duration: 0.7, emphasis: false },
  { text: '03:14 JST. RAIN CONTINUES TO OBSCURRY THE HARBOR.', delay: 1.1, duration: 0.6, emphasis: false },
  {
    text: 'MULTIPLE ABILITY SIGNATURES LOGGED. SECTOR 4.',
    delay: 1.9,
    duration: 0.8,
    emphasis: false,
  },
  {
    text: 'THIS IS NOT AN OPEN FORUM. THIS IS THE ARCHIVE.',
    delay: 3.5,
    duration: 0.8,
    emphasis: false,
  },
  {
    text: 'ACCESSING SPECIAL DIVISION CLASSIFIED RECORDS...',
    delay: 4.4,
    duration: 0.8,
    emphasis: false,
  },
  { text: 'THE CITY NEVER FORGETS A CRIMSON DEED.', delay: 6.5, duration: 0.8, emphasis: true },
  { text: 'SUBJECT IDENTIFIED. DOSSIER ACCESS GRANTED.', delay: 7.4, duration: 0.7, emphasis: true },
  {
    text: "REGISTRY CASE YKH-2026-X IS NOW ACTIVE.",
    delay: 8.2,
    duration: 0.7,
    emphasis: true,
  },
] as const

const HOME_INTRO_SESSION_KEY = 'bsd-home-intro-seen'
const INTRO_SPLASH_TITLE = ['Bungou', 'Stray Dogs'] as const

function accentStyle(color: string): CSSProperties {
  return { '--card-accent': color } as CSSProperties
}

function groupVisible(filter: HomeCharacterFilter, group: HomeCharacterFilter) {
  return filter === 'all' || filter === group
}

export function HomeShowcase() {
  const { theme } = useTheme()
  const { profile } = useAuth()
  const [activeFilter, setActiveFilter] = useState<HomeCharacterFilter>('all')
  const [showIntro, setShowIntro] = useState(false)
  const [introReady, setIntroReady] = useState(false)

  // --- ADDED: State to hold our live faction data ---
  const [liveFactions, setLiveFactions] = useState<Array<typeof HOME_FACTIONS[0] & { rawAp?: number }>>(HOME_FACTIONS)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) {
      return
    }

    const elements = Array.from(
      root.querySelectorAll<HTMLElement>('[data-home-reveal]'),
    ).filter((element) => !element.classList.contains('visible'))

    if (!elements.length) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [activeFilter])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const hasSeenIntro = window.sessionStorage.getItem(HOME_INTRO_SESSION_KEY) === 'seen'
    setShowIntro(!hasSeenIntro)
    setIntroReady(true)
  }, [])

  useEffect(() => {
    if (!introReady || typeof document === 'undefined') {
      return
    }

    const html = document.documentElement
    const body = document.body

    if (showIntro) {
      // Prevent layout shift by keeping scrollbar gutter if possible
      const scrollBarWidth = window.innerWidth - html.clientWidth
      body.style.overflow = 'hidden'
      if (scrollBarWidth > 0) {
        body.style.paddingRight = `${scrollBarWidth}px`
      }
    } else {
      body.style.overflow = ''
      body.style.paddingRight = ''
    }

    return () => {
      body.style.overflow = ''
      body.style.paddingRight = ''
    }
  }, [introReady, showIntro])

  // --- ADDED: Fetch live faction stats on mount ---
  useEffect(() => {
    async function fetchLiveFactions() {
      try {
        const res = await fetch('/api/faction')
        const json = await res.json()

        if (json.data && Array.isArray(json.data)) {
          const realData = json.data

          // Find the highest AP to calculate the bar percentages correctly
          const maxAp = Math.max(
            ...realData.map((r: any) => r.ap || 0),
            1 // prevent division by zero
          )

          setLiveFactions(current =>
            current.map(hf => {
              // Match the hardcoded faction with the real database faction
              const real = realData.find((r: any) => r.id === hf.id)
              if (!real) return hf

              return {
                ...hf,
                apDisplay: `${real.ap.toLocaleString()} AP`,
                memberDisplay: `${real.member_count.toLocaleString()} members`,
                // Calculate real percentage for the visual bars (minimum 2% so it's visible)
                barPercent: Math.max(2, Math.round((real.ap / maxAp) * 100)),
                // Store raw AP so we can format it for the small top strip
                rawAp: real.ap
              }
            })
          )
        }
      } catch (err) {
        console.error('Failed to load live factions:', err)
      }
    }
    fetchLiveFactions()
  }, [])

  const themeCopy = HOME_THEME_CONTENT[theme]
  const visibleCharacters = HOME_CHARACTERS.filter((character) =>
    groupVisible(activeFilter, character.filter),
  )
  const cityReturnHref =
    profile?.faction &&
      (profile.role === 'member' || profile.role === 'mod' || profile.role === 'owner')
      ? `/faction/${toPrivateFactionRouteId(profile.faction)}`
      : resolvePostAuthPath(profile)

  function dismissIntro() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(HOME_INTRO_SESSION_KEY, 'seen')
    }

    setShowIntro(false)
  }

  return (
    <div ref={rootRef} className={styles.showcase}>
      <section className={styles.hero} id="home">
        <div className={styles.heroSky} />
        <div className={styles.heroVignette} />
        <div className={styles.heroShoji} />
        <div className={styles.heroKanji} aria-hidden="true">
          {themeCopy.heroKanji}
        </div>
        <RainLayer />

        <div className={styles.heroCity} aria-hidden="true">
          <svg
            viewBox="0 0 1400 400"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMax meet"
            className={styles.skylineSvg}
          >
            <defs>
               <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                  </feMerge>
              </filter>
              <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <g fill="currentColor" opacity="var(--city-opacity, 0.18)">
              {/* Port & Warehouse Base */}
              <rect x="0" y="320" width="1400" height="80" opacity="0.1" />
              
              {/* Left Industrial Block (Warehouse) */}
              <rect x="50" y="240" width="120" height="160" />
              <rect x="60" y="220" width="100" height="25" />
              <circle cx="110" cy="205" r="8" /> {/* Industrial Vent */}

              {/* Power Lines & Poles */}
              <g className={styles.skylinePowerLines} stroke="currentColor" strokeWidth="0.5" opacity="0.6">
                <line x1="180" y1="360" x2="180" y2="160" strokeWidth="2" />
                <line x1="170" y1="170" x2="190" y2="170" strokeWidth="1" />
                <line x1="180" y1="180" x2="400" y2="200" opacity="0.4" />
                <line x1="180" y1="170" x2="400" y2="190" opacity="0.4" />
                
                <line x1="400" y1="360" x2="400" y2="180" strokeWidth="2" />
                <line x1="390" y1="190" x2="410" y2="190" strokeWidth="1" />
              </g>

              {/* Central City Profile (1930s silhouettes) */}
              <rect x="520" y="160" width="80" height="240" />
              <rect x="530" y="130" width="60" height="35" />
              <rect x="555" y="80" width="10" height="60" />

              <rect x="650" y="220" width="140" height="180" />
              <polygon points="650,220 720,180 790,220" />

              {/* Port Cranes (Enriched) */}
              <g transform="translate(850, 180)" stroke="currentColor" strokeWidth="1.5">
                 <line x1="0" y1="0" x2="0" y2="220" strokeWidth="3" />
                 <line x1="0" y1="20" x2="-80" y2="-20" strokeWidth="2" />
                 <line x1="-80" y1="-20" x2="-80" y2="10" />
                 <rect x="-5" y="-5" width="10" height="10" />
              </g>

              {/* Distant Watchtower */}
              <rect x="1050" y="140" width="40" height="260" />
              <rect x="1045" y="130" width="50" height="15" />
              <circle cx="1070" cy="115" r="10" opacity="0.5" />

              {/* Right Wharf Structures */}
              <rect x="1150" y="280" width="200" height="120" />
              <rect x="1170" y="260" width="40" height="25" />
              <rect x="1230" y="250" width="40" height="35" />
            </g>

            {/* Rain lines removed for hydration safety */}
          </svg>
        </div>

        <div className={styles.verticalLeft}>文豪ストレイドッグス · 横浜 · Yokohama</div>
        <div className={styles.verticalRight}>Ability Users · Registry Files · 異能力</div>

        <div className={styles.heroContent}>
          <div className={styles.heroInner}>
            <div className={styles.heroNarrative}>
              {OPENING_SEQUENCE.map((line) => (
                <motion.p
                  key={line.text}
                  className={
                    line.emphasis ? styles.heroNarrativeEmphasis : styles.heroNarrativeLine
                  }
                  initial={{ opacity: 0, y: 10, clipPath: 'inset(0 100% 0 0)' }}
                  animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0% 0 0)' }}
                  transition={{
                    delay: line.delay,
                    duration: line.duration,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {line.text}
                </motion.p>
              ))}

              <motion.div
                className={styles.heroActionSlot}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 11.1, duration: 0.45, ease: 'backOut' }}
              >
                <Link href={profile ? cityReturnHref : '/login'} className="btn-primary">
                  {profile ? 'Return to the City' : 'Register Your Presence'}
                </Link>
              </motion.div>

              <motion.p
                className={styles.heroSubnote}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 11.5, duration: 0.45 }}
              >
                文豪アーカイブ - A record of Yokohama&apos;s ability users
              </motion.p>
            </div>

            <p className={`reveal ${styles.heroEyebrow}`} data-home-reveal>
              {themeCopy.label}
            </p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.23,
                    delayChildren: 0.08,
                  },
                },
              }}
            >
              <motion.h1
                className={styles.heroTitle}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                Bungou <span className={styles.heroTitleAccent}>Archive</span>
              </motion.h1>

              <motion.p
                className={styles.heroTitleJp}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                文豪アーカイブ · 横浜の記録
              </motion.p>

              <motion.div
                className={styles.heroDivider}
                variants={{
                  hidden: { opacity: 0, scaleX: 0.75 },
                  visible: { opacity: 1, scaleX: 1 },
                }}
              />

              <motion.p
                className={styles.heroQuote}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                {themeCopy.quote}
              </motion.p>

              <motion.div
                className={styles.heroActions}
                variants={{
                  hidden: { opacity: 0, scale: 0.96 },
                  visible: { opacity: 1, scale: 1 },
                }}
              >
                <Link href={profile ? cityReturnHref : '/login'} className="btn-primary">
                  {profile ? 'Return to the City' : 'Begin Registration'}
                </Link>
                <a href="#factions" className="btn-secondary">
                  Enter Factions →
                </a>
              </motion.div>

              <motion.p
                className={styles.heroThemeAttr}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                {themeCopy.attr}
              </motion.p>

              <motion.p
                className={styles.heroQuoteAttr}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                文豪アーカイブ — A record of Yokohama&apos;s ability users
              </motion.p>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {introReady && showIntro ? (
            <motion.div
              className={styles.heroIntroOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
              style={{ willChange: 'opacity' }}
            >
              <motion.div
                className={styles.heroIntroPanel}
                initial={{ opacity: 0, y: 12, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 1.01 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ willChange: 'opacity, transform' }}
              >
                <motion.p
                  className={styles.heroIntroTag}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.45 }}
                >
                  文豪ストレイドッグス
                </motion.p>

                <div className={styles.heroIntroWordmark}>
                  {INTRO_SPLASH_TITLE.map((line, index) => (
                    <motion.h2
                      key={line}
                      className={
                        index === 1 ? styles.heroIntroTitleAccent : styles.heroIntroTitle
                      }
                      initial={{ opacity: 0, y: 26, letterSpacing: '0.14em' }}
                      animate={{ opacity: 1, y: 0, letterSpacing: '0.06em' }}
                      transition={{
                        delay: 0.32 + index * 0.12,
                        duration: 0.55,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {line}
                    </motion.h2>
                  ))}
                </div>

                <motion.p
                  className={styles.heroIntroSubline}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.72, duration: 0.45 }}
                >
                  Yokohama keeps its files sealed until you step inside.
                </motion.p>

                <motion.div
                  className={styles.heroIntroAction}
                  initial={{ opacity: 0, scale: 0.94, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.45, ease: 'backOut' }}
                >
                  <button type="button" className="btn-primary" onClick={dismissIntro}>
                    Continue into Yokohama
                  </button>
                </motion.div>

                <motion.p
                  className={styles.heroIntroNote}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.02, duration: 0.45 }}
                >
                  The city opens only once. After that, the archive remains.
                </motion.p>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className={styles.strip}>
          <span className={styles.stripLabel}>Faction War · Live</span>
          <div className={styles.stripItems}>
            {/* --- UPDATED: Use liveFactions here --- */}
            {liveFactions.filter((faction) => faction.joinable).map((faction) => (
              <div key={faction.id} className={styles.stripItem}>
                <span className={styles.stripName}>{faction.name}</span>
                <span className={styles.stripBarTrack}>
                  <span
                    className={styles.stripBar}
                    style={{
                      width: `${faction.barPercent}%`,
                      display: 'block',
                      background: faction.color,
                    }}
                  />
                </span>
                {/* --- UPDATED: Format AP efficiently for the top strip --- */}
                <span className={styles.stripScore}>
                  {faction.rawAp ? `${(faction.rawAp / 1000).toFixed(1)}k AP` : faction.apDisplay}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionMuted}`} id="factions">
        <div className={styles.sectionWrap}>
          <div className={`reveal ${styles.sectionHead}`} data-home-reveal>
            <p className={styles.sectionEyebrow}>勢力 · The Factions of Yokohama</p>
            <h2 className={styles.sectionTitle}>
              Eight Powers. <em>One City.</em>
            </h2>
            <div className={styles.sectionDivider} />
            <p className={styles.sectionSub}>
              Every faction believes its philosophy is the only truth. The city
              decides who looks strongest this week.
            </p>
          </div>

          <div className={styles.factionGrid}>
            {/* --- UPDATED: Use liveFactions here to drive the grid stats --- */}
            {liveFactions.map((faction, index) => (
              <Link
                key={faction.id}
                href="/factions"
                className={`reveal ${styles.factionCard} ${
                  ['rats', 'decay', 'clock_tower'].includes(faction.id) ? styles.factionCardLocked : ''
                }`}
                data-home-reveal
                data-faction={faction.id}
                style={{ transitionDelay: `${index * 60}ms` }}
              >
                <div className="faction-bleed" />
                <span className={styles.factionRank}>{faction.rank}</span>
                <p className={styles.factionStatus}>{faction.status}</p>
                <h3 className={styles.factionName}>{faction.name}</h3>
                <p className={styles.factionNameJp}>{faction.nameJp}</p>
                <p className={styles.factionPhilosophy}>{faction.philosophy}</p>
                <p className={styles.factionDesc}>{faction.description}</p>
                <div className={styles.factionBarTrack}>
                  <div
                    className={styles.factionBarFill}
                    style={{ width: `${faction.barPercent}%`, background: faction.color }}
                  />
                </div>
                <div className={styles.factionMeta}>
                  <span className={styles.factionAp}>{faction.apDisplay}</span>
                  <span className={styles.factionMembers}>{faction.memberDisplay}</span>
                </div>
                <span className={styles.factionKanji}>{faction.kanji}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="global-chat">
        <div className={styles.sectionWrap}>
          <div className={`reveal ${styles.sectionHead}`} data-home-reveal>
            <p className={styles.sectionEyebrow}>公衆無線 · Global Transmission</p>
            <h2 className={styles.sectionTitle}>
              The City’s <em>Open Signal</em>
            </h2>
            <div className={styles.sectionDivider} />
            <p className={styles.sectionSub}>
              Unencrypted channels for all registered users. What happens in the 
              streets is recorded here.
            </p>
          </div>
          
          <div className={`reveal ${styles.globalChatContainer}`} data-home-reveal>
            <GlobalChat />
          </div>
        </div>
      </section>

      <section className={styles.section} id="lore">
        <div className={styles.sectionWrap}>
          <div className={`reveal ${styles.sectionHead}`} data-home-reveal>
            <p className={styles.sectionEyebrow}>書庫 · The Literary Archive</p>
            <h2 className={styles.sectionTitle}>
              Lore, Theory & <em>Character Studies</em>
            </h2>
            <div className={styles.sectionDivider} />
            <p className={styles.sectionSub}>
              Community essays and character studies in the Hall. Deeper reads in the Records route.
            </p>
          </div>

          <div className={styles.loreGrid}>
            {HOME_LORE_POSTS.map((post, index) => (
              <Link
                key={post.slug}
                href="/records?tab=lore"
                className={`reveal ${styles.loreCard} ${post.featured ? styles.loreFeatured : ''
                  }`}
                data-home-reveal
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <span className={styles.loreTag}>{post.category}</span>
                <h3 className={styles.loreTitle}>{post.title}</h3>
                <p className={styles.loreExcerpt}>{post.excerpt}</p>
                <p className={styles.loreMeta}>{post.meta}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionMuted}`} id="exam">
        <div className={styles.sectionWrap}>
          <div className={`reveal ${styles.sectionHead}`} data-home-reveal>
            <p className={styles.sectionEyebrow}>能力者判定 · Character Assignment</p>
            <h2 className={styles.sectionTitle}>
              The Registry <em>Starts Here</em>
            </h2>
            <div className={styles.sectionDivider} />
            <p className={styles.sectionSub}>
              Launch assignment is faction-first: seven sealed questions, one
              result, and character matches unlocked via city activity.
            </p>
          </div>

          <div className={`reveal ${styles.examCard}`} data-home-reveal>
            <span className={styles.examStamp}>Faction Registry · Preview</span>
            <div className={styles.examProgress}>
              {Array.from({ length: 7 }).map((_, index) => (
                <span
                  key={index}
                  className={`${styles.examDot} ${index === 0 ? styles.examDotActive : ''
                    }`}
                />
              ))}
            </div>

            <p className={styles.examScenarioNum}>Question 01 · 7 sealed prompts</p>
            <p className={styles.examQuestion}>{HOME_QUIZ_PREVIEW.question}</p>

            <div className={styles.examOptions}>
              {HOME_QUIZ_PREVIEW.options.map((option) => (
                <div key={option.id} className={styles.examPreviewOption}>
                  <span className={styles.examOptionKey}>{option.id}</span>
                  <span>{option.text}</span>
                </div>
              ))}
            </div>
            <div className={styles.examCallToAction}>
              <Link href="/login" className="btn-primary">
                Enter the Registry
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="fandom">
        <div className={styles.sectionWrap}>
          <div className={`reveal ${styles.sectionHead}`} data-home-reveal>
            <p className={styles.sectionEyebrow}>能力者図鑑 · The Ability Registry</p>
            <h2 className={styles.sectionTitle}>
              Characters & <em>Their Gifts</em>
            </h2>
            <div className={styles.sectionDivider} />
            <p className={styles.sectionSub}>
              The homepage archive carries the full roster now. Filter by faction
              and read the file before you enter the deeper pages.
            </p>
          </div>

          <div className={`reveal ${styles.archiveControls}`} data-home-reveal>
            {HOME_CHARACTER_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`${styles.filterButton} ${activeFilter === filter.id ? styles.filterButtonActive : ''
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className={styles.archiveGrid}>
            {visibleCharacters.map((character, index) => (
              <article
                key={character.slug}
                className={`reveal ${styles.characterCard} faction-corner`}
                data-home-reveal
                style={{
                  transitionDelay: `${Math.min(index, 11) * 45}ms`,
                  '--card-accent': character.accentColor,
                } as any}
              >
                <div className="faction-bleed" />
                <div className={styles.characterHeader}>
                  <span className={styles.characterBadge}>{character.factionBadge}</span>
                  <span className={styles.abilityBadge} data-type={character.abilityType}>
                    {character.abilityType}
                  </span>
                </div>
                <h3 className={styles.characterName}>{character.name}</h3>
                <p className={styles.characterNameJp}>{character.nameJp}</p>
                <p className={styles.characterAbility}>{character.ability}</p>
                <p className={styles.characterAbilityJp}>{character.abilityJp}</p>
                <p className={styles.characterSummary}>{character.summary}</p>
                <p className={styles.characterQuote}>{character.quote}</p>

                <div className={styles.characterStats}>
                  {[
                    { label: 'POWER', value: character.stats.power },
                    { label: 'INTEL', value: character.stats.intel },
                    { label: 'LOYALTY', value: character.stats.loyalty },
                    { label: 'CONTROL', value: character.stats.control },
                  ].map((stat) => (
                    <div key={stat.label} className={styles.statBox}>
                      <div className={styles.statLine}>
                        <span className={styles.statLabel}>{stat.label}</span>
                        <span className={styles.statValue}>
                          {RESERVED_SLUGS.includes(character.slug) ? '░░░' : stat.value}
                        </span>
                      </div>
                      <div className={styles.characterStatTrack}>
                        <div
                           className={styles.characterStatFill}
                           style={{ 
                             width: RESERVED_SLUGS.includes(character.slug) ? '100%' : `${stat.value}%`,
                             opacity: RESERVED_SLUGS.includes(character.slug) ? 0.3 : 1
                           }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {RESERVED_SLUGS.includes(character.slug) && (
                  <div className={styles.classifiedStamp}>
                    <div className="ink-stamp" style={{ fontSize: '0.45rem', padding: '0.2rem 0.4rem', borderStyle: 'double' }}>
                      CLASSIFIED / RESERVED
                    </div>
                  </div>
                )}

                <p className={styles.characterAuthor}>
                  <span>{character.authorNote}</span>
                </p>
                <span className={styles.characterSymbol}>{character.symbol}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}