'use client'

import { useState, useCallback, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TacticalMap } from '@/frontend/components/wars/TacticalMap'
import { SectorPanel, type StrikeLaunchPayload } from '@/frontend/components/wars/SectorPanel'
import { StrikeModal } from '@/frontend/components/wars/StrikeModal'
import { TransmissionsFeed } from '@/frontend/components/wars/TransmissionsFeed'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Map as MapIcon, Swords } from 'lucide-react'
import type { District } from '@/backend/models/district.model'
import type { FactionWar } from '@/backend/types'

interface DistrictsClientProps {
  initialDistricts: District[]
  activeWars: FactionWar[]
}

function isValidWarId(value: string | null | undefined): value is string {
  return Boolean(
    value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  )
}

export function DistrictsClient({
  initialDistricts,
  activeWars,
}: DistrictsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null)
  const [isStrikeModalOpen, setIsStrikeModalOpen] = useState(false)
  const [strikePayload, setStrikePayload] = useState<StrikeLaunchPayload | null>(null)
  const [currentActiveWars, setCurrentActiveWars] = useState<FactionWar[]>(activeWars)

  const refreshActiveWar = useCallback(async () => {
    try {
      const res = await fetch('/api/war/active', { cache: 'no-store' })
      const payload = await res.json()
      if (res.ok) {
        setCurrentActiveWars(Array.isArray(payload?.data) ? payload.data : [])
      }
    } catch (err) {
      console.error('Failed to refresh active war:', err)
    }
  }, [])

  const matchesDistrictWar = useCallback((district: District, war: FactionWar) => {
    const districtRef = war.stakes_detail?.district_id
    if (!districtRef || war.stakes !== 'district' || war.status === 'complete') {
      return false
    }

    return (
      districtRef === district.id ||
      districtRef === district.slug ||
      (district.slug === 'yokohama-port' && ['harbor', 'standard_island', 'standard-island', 'harbor-district'].includes(districtRef)) ||
      (district.slug === 'minato-mirai' && districtRef === 'waterfront') ||
      (district.slug === 'tsurumi-district' && districtRef === 'tsurumi') ||
      (district.slug === 'honmoku-area' && districtRef === 'honmoku') ||
      (district.slug === 'kannai-center' && districtRef === 'kannai') ||
      (district.slug === 'northern-wards' && districtRef === 'northern_wards') ||
      (district.slug === 'suribachi-city' && districtRef === 'suribachi')
    )
  }, [])

  const selectedDistrictWar = selectedDistrict
    ? currentActiveWars.find(
        (war) => matchesDistrictWar(selectedDistrict, war),
      ) ?? null
    : null
  const feedWarId = isValidWarId(selectedDistrictWar?.id)
    ? selectedDistrictWar.id
    : isValidWarId(currentActiveWars[0]?.id)
      ? currentActiveWars[0].id
      : null

  const handleStrikeComplete = useCallback((result?: { warResolved?: boolean } | null) => {
    setIsStrikeModalOpen(false)
    setStrikePayload(null)
    void refreshActiveWar()
    if (result?.warResolved) {
      startTransition(() => {
        router.refresh()
      })
    }
  }, [refreshActiveWar, router])

  const handleDistrictSelect = useCallback((d: District) => {
    setSelectedDistrict(d)
    setStrikePayload(null)
    setIsStrikeModalOpen(false)
  }, [])

  const handlePanelClose = useCallback(() => {
    setSelectedDistrict(null)
    setStrikePayload(null)
    setIsStrikeModalOpen(false)
    void refreshActiveWar()
  }, [refreshActiveWar])

  useEffect(() => {
    setCurrentActiveWars(activeWars)
  }, [activeWars])

  useEffect(() => {
    void refreshActiveWar()
  }, [refreshActiveWar])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black pt-16 flex flex-col md:flex-row">
      <div className="w-full md:w-16 bg-[#0a0a0a] border-b md:border-b-0 md:border-r border-[#222] flex md:flex-col items-center py-4 px-2 md:px-0 gap-6 z-20">
        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 mb-auto hidden md:block">
          <Terminal className="w-5 h-5 text-amber-500" />
        </div>

        <button
          className="p-3 rounded-lg bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          title="Tactical Map"
        >
          <MapIcon className="w-5 h-5" />
        </button>

        {currentActiveWars.length > 0 && (
          <div className="mt-auto hidden md:flex flex-col items-center gap-2 pb-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <Swords className="w-4 h-4 text-red-500/60" />
          </div>
        )}

        <div className="mt-auto hidden md:flex flex-col items-center gap-4 py-4 text-[#333]">
          <span className="font-space-mono text-[0.4rem] rotate-90 origin-center whitespace-nowrap tracking-[0.5em]">
            v2.0.4 - YKH
          </span>
        </div>
      </div>

      <div className="flex-1 relative bg-black flex flex-col overflow-hidden">
        <div className="flex-1 relative min-h-[60vh]">
          <TacticalMap
            districts={initialDistricts}
            onDistrictSelect={handleDistrictSelect}
            activeWars={currentActiveWars}
          />

          <div className="absolute top-6 left-6 pointer-events-none z-10">
            <div className="space-y-1">
              <h1 className="font-cinzel text-3xl text-white uppercase tracking-[0.2em]">
                Yokohama <em>Grid</em>
              </h1>
              <p className="font-space-mono text-[0.5rem] text-white/30 tracking-[0.4em]">
                TERRITORIAL_SECURITY_UPLINK
              </p>
            </div>
          </div>

          {isPending && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-black/80 border border-amber-500/30 px-4 py-2 rounded font-space-mono text-[0.6rem] text-amber-500 tracking-widest flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-3 h-3 border border-amber-500/40 border-t-amber-500 rounded-full"
                />
                SYNCING_GRID_DATA
              </div>
            </div>
          )}

          <div className="absolute inset-0 pointer-events-none opacity-[0.03] brain-scan-vignette" />
        </div>

        <TransmissionsFeed warId={feedWarId} />
      </div>

      <AnimatePresence>
        {selectedDistrict && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handlePanelClose}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[90] md:hidden"
            />

            <motion.div
              key={selectedDistrict.id}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-16 bottom-0 right-0 z-[1000] w-full sm:w-[500px] md:w-[450px] lg:w-[480px] bg-black shadow-[-20px_0_100px_rgba(0,0,0,1)] border-l border-white/20 flex flex-col overflow-hidden"
            >
              <SectorPanel
                district={selectedDistrict}
                allDistricts={initialDistricts}
                onStrikeClick={(payload) => {
                  setStrikePayload(payload)
                  setIsStrikeModalOpen(true)
                }}
                onClose={handlePanelClose}
                activeWar={selectedDistrictWar}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isStrikeModalOpen && selectedDistrict && strikePayload && (
          <StrikeModal
            district={selectedDistrict}
            warId={
              isValidWarId(strikePayload.warId)
                ? strikePayload.warId
                : isValidWarId(selectedDistrictWar?.id)
                  ? selectedDistrictWar.id
                  : null
            }
            targets={strikePayload.targets}
            specialLocked={strikePayload.specialLocked}
            mustTargetGuards={strikePayload.mustTargetGuards}
            onClose={handleStrikeComplete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
