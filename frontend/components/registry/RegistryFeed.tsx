'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { FactionId, RegistryDistrict, RegistryPost } from '@/backend/types'
import { REGISTRY_DISTRICT_LABELS } from '@/backend/lib/registry'
import { useAuth } from '@/frontend/context/AuthContext'
import { FACTION_META } from '@/frontend/lib/launch'
import { AngoUsername } from '@/frontend/components/ango/AngoUsername'
import { usePersistentData } from '@/frontend/hooks/usePersistentData'
import styles from './Registry.module.css'

export function RegistryFeed({ initialPosts: serverPosts }: { initialPosts: RegistryPost[] }) {
  const { profile } = useAuth()

  // Use persistent data for 'Warm Start' UX
  const [initialPosts, setPersistentPosts] = usePersistentData<RegistryPost[]>('registry_list', serverPosts)

  // Sync server posts to persistence when they change
  useEffect(() => {
    if (serverPosts.length) {
      setPersistentPosts(serverPosts)
    }
  }, [serverPosts])

  const [faction, setFaction] = useState<FactionId | 'all'>('all')
  const [district, setDistrict] = useState<RegistryDistrict | 'all'>('all')
  const [sort, setSort] = useState<'recent' | 'saved' | 'featured'>('recent')

  const canSubmitRegistry = profile?.role === 'mod' || profile?.role === 'owner'

  const posts = useMemo(() => {
    const filtered = initialPosts.filter((post) => {
      const factionOk = faction === 'all' ? true : post.author_faction === faction
      const districtOk = district === 'all' ? true : post.district === district
      return factionOk && districtOk
    })

    return [...filtered].sort((left, right) => {
      if (sort === 'saved') return right.save_count - left.save_count
      if (sort === 'featured') return Number(right.featured) - Number(left.featured)
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    })
  }, [district, faction, initialPosts, sort])

  return (
    <div className={styles.shell}>
      <div className={styles.controls}>
        <select className={styles.control} value={faction} onChange={(e) => setFaction(e.target.value as FactionId | 'all')}>
          <option value="all">All Factions</option>
          <option value="agency">Agency</option>
          <option value="mafia">Mafia</option>
          <option value="guild">Guild</option>
          <option value="hunting_dogs">Dogs</option>
          <option value="special_div">Special</option>
        </select>
        <select className={styles.control} value={district} onChange={(e) => setDistrict(e.target.value as RegistryDistrict | 'all')}>
          <option value="all">All Districts</option>
          {Object.entries(REGISTRY_DISTRICT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select className={styles.control} value={sort} onChange={(e) => setSort(e.target.value as 'recent' | 'saved' | 'featured')}>
          <option value="recent">Recent</option>
          <option value="saved">Most Saved</option>
          <option value="featured">Featured</option>
        </select>
        <div className={styles.metaRow} style={{ marginTop: 0, alignItems: 'stretch' }}>
          <Link href="/registry/saved" className={`${styles.saveButton} ${styles.saveButtonSecondary}`}>
            Saved Files
          </Link>
          {canSubmitRegistry ? (
            <Link href="/registry/submit" className={styles.saveButton}>
              Submit Report
            </Link>
          ) : (
            <Link href="/lore/submit" className={styles.saveButton}>
              Write Lore
            </Link>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        {posts.map((post) => (
          <Link key={post.id} href={`/registry/${encodeURIComponent(post.case_number)}`} className={styles.card}>
            {post.featured ? <span className={`${styles.stamp} ${styles.featured}`}>Featured</span> : null}
            <div className={styles.meta}>{post.case_number}</div>
            <h2 className={styles.title}>{post.title}</h2>
            <div className={styles.metaRow}>
              <span className={styles.meta}>{post.post_type.replace(/_/g, ' ')}</span>
              <span className={styles.meta}>{post.author_character ?? 'Unknown file'}</span>
              {post.profiles?.username ? (
                <span className={styles.meta}>
                  <AngoUsername userId={post.author_id} username={post.profiles.username} />
                </span>
              ) : null}
              <span className={styles.meta}>{post.author_rank ?? 'Unfiled'}</span>
              <span className={styles.meta}>
                {post.author_faction ? FACTION_META[post.author_faction].name : 'Unaffiliated'}
              </span>
            </div>
            <p className={styles.excerpt}>{post.content.slice(0, 160)}...</p>
            <div className={styles.statsRow}>
              <span className={styles.counter}>{post.word_count} words</span>
              <span className={styles.counter}>{post.save_count} saves</span>
              <span className={styles.counter}>
                {post.district ? REGISTRY_DISTRICT_LABELS[post.district] : 'Other'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
