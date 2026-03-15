'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { FactionId, RegistryDistrict, RegistryPost } from '@/backend/types'
import { REGISTRY_DISTRICT_LABELS } from '@/backend/lib/registry'
import { useAuth } from '@/frontend/context/AuthContext'
import { FACTION_META } from '@/frontend/lib/launch'
import { AngoUsername } from '@/frontend/components/ango/AngoUsername'
import { usePersistentData } from '@/frontend/hooks/usePersistentData'
import styles from './Registry.module.css'

export function RegistryFeed({ initialPosts }: { initialPosts: RegistryPost[] }) {
  const { profile } = useAuth()

  const [faction, setFaction] = useState<FactionId | 'all'>('all')
  const [district, setDistrict] = useState<RegistryDistrict | 'all'>('all')
  const [sort, setSort] = useState<'recent' | 'saved' | 'featured'>('recent')
  const [page, setPage] = useState(0)
  const [posts, setPosts] = usePersistentData<RegistryPost[]>('registry_list', initialPosts)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length >= 50)

  const canSubmitRegistry = profile?.role === 'mod' || profile?.role === 'owner'

  const fetchPosts = useCallback(async (isLoadMore = false) => {
    setLoading(true)
    const nextPage = isLoadMore ? page + 1 : 0
    
    try {
      const params = new URLSearchParams({
        faction,
        district,
        sort,
        page: String(nextPage),
        limit: '50'
      })
      
      const response = await fetch(`/api/records/registry/public?${params.toString()}`)
      const json = await response.json()
      const newPosts = (json.data as RegistryPost[]) || []
      
      if (isLoadMore) {
        setPosts((prev) => [...prev, ...newPosts])
        setPage(nextPage)
      } else {
        setPosts(newPosts)
        setPage(0)
      }
      
      setHasMore(newPosts.length >= 50)
    } catch (error) {
      console.error('Failed to fetch registry posts:', error)
    } finally {
      setLoading(false)
    }
  }, [district, faction, page, setPosts, sort])

  // Refetch when filters change
  useEffect(() => {
    // Skip initial fetch if we already have server-rendered posts
    if (page === 0 && posts.length === initialPosts.length && faction === 'all' && district === 'all' && sort === 'recent') {
      return
    }
    void fetchPosts(false)
  }, [faction, district, sort])

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
          <Link href="/records/field-notes/saved" className={`${styles.saveButton} ${styles.saveButtonSecondary}`}>
            Saved Notes
          </Link>
          {canSubmitRegistry ? (
            <Link href="/records/field-notes/submit" className={styles.saveButton}>
              File Field Note
            </Link>
          ) : (
            <Link href="/records/lore/submit" className={styles.saveButton}>
              Write Lore
            </Link>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        {posts.map((post) => (
          <Link key={post.id} href={`/records/field-notes/${encodeURIComponent(post.case_number)}`} className={styles.card}>
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

        {!loading && posts.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyBox}>
              <div className="ink-stamp">SEALED</div>
              <p className={styles.emptyText}>
                No intelligence reports match these coordinates.
                The city remains silent for now.
              </p>
              <span className={styles.emptyKanji}>密封</span>
            </div>
          </div>
        )}
      </div>

      {hasMore && (
        <div className={styles.loadMoreContainer}>
          <button 
            className={styles.loadMoreButton} 
            onClick={() => void fetchPosts(true)}
            disabled={loading}
          >
            {loading ? 'Transmitting...' : 'Decrypt More Records'}
          </button>
        </div>
      )}
    </div>
  )
}
