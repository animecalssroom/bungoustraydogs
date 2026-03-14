'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '@/frontend/context/ThemeContext'
import { useAuth } from '@/frontend/context/AuthContext'
import {
  HOME_ARENA_DEBATE,
  HOME_CHARACTER_FILTERS,
  HOME_CHARACTERS,
  HOME_FACTIONS,
  HOME_LORE_POSTS,
  HOME_THEME_CONTENT,
  type HomeCharacterFilter,
} from '@/frontend/lib/home-content'
import { resolvePostAuthPath, toPrivateFactionRouteId } from '@/frontend/lib/launch'
import RainLayer from '@/frontend/components/ui/RainLayer'
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
  { text: 'Yokohama does not announce itself.', delay: 0.2, duration: 0.7, emphasis: false },
  { text: 'It simply exists -', delay: 1.1, duration: 0.6, emphasis: false },
  {
    text: 'rain-soaked, gaslit, watching from the harbor.',
    delay: 1.9,
    duration: 0.8,
    emphasis: false,
  },
  {
    text: 'The ability users came before the war ended.',
    delay: 4.0,
    duration: 0.8,
    emphasis: false,
  },
  {
    text: 'Nobody remembers where they went after.',
    delay: 4.9,
    duration: 0.8,
    emphasis: false,
  },
  { text: 'The city remembers everything.', delay: 7.1, duration: 0.8, emphasis: true },
  { text: 'You have been here before.', delay: 8.0, duration: 0.7, emphasis: true },
  {
    text: "You just don't know it yet.",
    delay: 8.8,
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

  const totalVotes = HOME_ARENA_DEBATE.votesA + HOME_ARENA_DEBATE.votesB
  const percentA = Math.round((HOME_ARENA_DEBATE.votesA / totalVotes) * 100)
  const percentB = 100 - percentA
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
            viewBox="0 0 1400 320"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMax meet"
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            <g fill="currentColor" opacity="0.16">
              <rect x="0" y="190" width="58" height="130" />
              <rect x="20" y="158" width="18" height="32" />
              <rect x="65" y="176" width="84" height="144" />
              <rect x="86" y="140" width="16" height="36" />
              <rect x="152" y="150" width="54" height="170" />
              <rect x="168" y="120" width="12" height="30" />
              <polygon points="228,132 266,90 304,132" />
              <rect x="232" y="132" width="72" height="188" />
              <polygon points="236,126 266,84 296,126" />
              <rect x="246" y="82" width="40" height="12" />
              <rect x="252" y="60" width="28" height="24" />
              <rect x="320" y="180" width="88" height="140" />
              <rect x="340" y="150" width="12" height="30" />
              <rect x="370" y="158" width="12" height="22" />
              <rect x="410" y="160" width="74" height="160" />
              <rect x="480" y="152" width="58" height="168" />
              <polygon points="480,152 509,114 538,152" />
              <rect x="544" y="176" width="48" height="144" />
              <rect x="598" y="160" width="70" height="160" />
              <rect x="615" y="126" width="20" height="34" />
              <rect x="672" y="182" width="60" height="138" />
              <rect x="740" y="120" width="74" height="200" />
              <rect x="754" y="80" width="44" height="40" />
              <rect x="768" y="52" width="16" height="28" />
              <rect x="822" y="164" width="62" height="156" />
              <rect x="900" y="150" width="80" height="170" />
              <polygon points="900,150 940,108 980,150" />
              <rect x="990" y="172" width="60" height="148" />
              <rect x="1060" y="154" width="84" height="166" />
              <rect x="1082" y="122" width="14" height="32" />
              <rect x="1150" y="170" width="68" height="150" />
              <rect x="1224" y="150" width="64" height="170" />
              <rect x="1240" y="120" width="16" height="30" />
              <rect x="1292" y="174" width="108" height="146" />
            </g>
            <rect x="0" y="308" width="1400" height="12" opacity="0.08" fill="currentColor" />
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
                className={`reveal ${styles.factionCard}`}
                data-home-reveal
                style={{ transitionDelay: `${index * 60}ms` }}
              >
                <span className={styles.factionRank}>{faction.rank}</span>
                <p className={styles.factionStatus}>{faction.status}</p>
                <h3 className={styles.factionName}>{faction.name}</h3>
                <p className={styles.factionNameJp}>{faction.nameJp}</p>
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
                className={`reveal ${styles.characterCard}`}
                data-home-reveal
                style={{
                  transitionDelay: `${Math.min(index, 11) * 45}ms`,
                  ...accentStyle(character.accentColor),
                }}
              >
                <span className={styles.characterBadge}>{character.factionBadge}</span>
                <h3 className={styles.characterName}>{character.name}</h3>
                <p className={styles.characterNameJp}>{character.nameJp}</p>
                <p className={styles.characterAbility}>{character.ability}</p>
                <p className={styles.characterAbilityJp}>{character.abilityJp}</p>
                <p className={styles.characterSummary}>{character.summary}</p>
                <p className={styles.characterQuote}>{character.quote}</p>

                <div className={styles.characterStats}>
                  {[
                    { label: 'Power', value: character.stats.power },
                    { label: 'Speed', value: character.stats.speed },
                    { label: 'Control', value: character.stats.control },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className={styles.characterStatLabel}>{stat.label}</p>
                      <div className={styles.characterStatTrack}>
                        <div
                          className={styles.characterStatFill}
                          style={{ width: `${stat.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <p className={styles.characterAuthor}>
                  <span>{character.authorNote}</span>
                </p>
                <span className={styles.characterSymbol}>{character.symbol}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionMuted}`} id="arena">
        <div className={styles.sectionWrap}>
          <div className={`reveal ${styles.sectionHead}`} data-home-reveal>
            <p className={styles.sectionEyebrow}>{HOME_ARENA_DEBATE.label}</p>
            <h2 className={styles.sectionTitle}>
              1v1 Community <em>Debate</em>
            </h2>
            <div className={styles.sectionDivider} />
            <p className={styles.sectionSub}>{HOME_ARENA_DEBATE.closesIn}</p>
          </div>

          <div className={`reveal ${styles.arenaCard}`} data-home-reveal>
            <p className={styles.arenaQuestion}>{HOME_ARENA_DEBATE.question}</p>

            <div className={styles.arenaSplit}>
              <div
                className={styles.fighter}
                style={accentStyle(HOME_ARENA_DEBATE.fighterA.accentColor)}
              >
                <span className={styles.fighterTag}>{HOME_ARENA_DEBATE.fighterA.factionBadge}</span>
                <h3 className={styles.fighterName}>{HOME_ARENA_DEBATE.fighterA.name}</h3>
                <p className={styles.fighterNameJp}>{HOME_ARENA_DEBATE.fighterA.nameJp}</p>
                <p className={styles.fighterAbility}>
                  {HOME_ARENA_DEBATE.fighterA.ability} · {HOME_ARENA_DEBATE.fighterA.abilityJp}
                </p>
                <p className={styles.fighterQuote}>{HOME_ARENA_DEBATE.fighterA.quote}</p>
                <div className={styles.fighterVotes}>{percentA}%</div>
                <span className={styles.fighterVotesLabel}>
                  {HOME_ARENA_DEBATE.votesA.toLocaleString()} votes · leading
                </span>
                <div className={styles.arenaAction}>
                  <Link href="/arena" className="btn-primary">
                    Vote {HOME_ARENA_DEBATE.fighterA.name.split(' ')[0]} →
                  </Link>
                </div>
                <span className={styles.fighterSymbol}>{HOME_ARENA_DEBATE.fighterA.symbol}</span>
              </div>

              <div className={styles.arenaVs}>
                <span className={styles.arenaLine} />
                <span className={styles.arenaVsText}>VS</span>
                <span className={styles.arenaLine} />
              </div>

              <div
                className={styles.fighter}
                style={accentStyle(HOME_ARENA_DEBATE.fighterB.accentColor)}
              >
                <span className={styles.fighterTag}>{HOME_ARENA_DEBATE.fighterB.factionBadge}</span>
                <h3 className={styles.fighterName}>{HOME_ARENA_DEBATE.fighterB.name}</h3>
                <p className={styles.fighterNameJp}>{HOME_ARENA_DEBATE.fighterB.nameJp}</p>
                <p className={styles.fighterAbility}>
                  {HOME_ARENA_DEBATE.fighterB.ability} · {HOME_ARENA_DEBATE.fighterB.abilityJp}
                </p>
                <p className={styles.fighterQuote}>{HOME_ARENA_DEBATE.fighterB.quote}</p>
                <div className={styles.fighterVotes}>{percentB}%</div>
                <span className={styles.fighterVotesLabel}>
                  {HOME_ARENA_DEBATE.votesB.toLocaleString()} votes
                </span>
                <div className={styles.arenaAction}>
                  <Link href="/arena" className="btn-secondary">
                    Vote {HOME_ARENA_DEBATE.fighterB.name.split(' ')[0]} →
                  </Link>
                </div>
                <span className={styles.fighterSymbol}>{HOME_ARENA_DEBATE.fighterB.symbol}</span>
              </div>
            </div>

            <div className={styles.arenaBarTrack}>
              <div
                className={styles.arenaBarFill}
                style={{
                  width: '100%',
                  background: `linear-gradient(90deg, ${HOME_ARENA_DEBATE.fighterA.accentColor} 0 ${percentA}%, ${HOME_ARENA_DEBATE.fighterB.accentColor} ${percentA}% 100%)`,
                }}
              />
            </div>
          </div>

          <div className={`reveal ${styles.arenaLink}`} data-home-reveal>
            <Link href="/arena" className="btn-secondary">
              Enter the Debate Hall →
            </Link>
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
              Editorial layout on the home page, deeper reads in the lore route.
            </p>
          </div>

          <div className={styles.loreGrid}>
            {HOME_LORE_POSTS.map((post, index) => (
              <Link
                key={post.slug}
                href="/lore"
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
              result, and no revisions after submission.
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
    </div>
  )
}