import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/frontend/lib/supabase/server'
import { RegistryModel } from '@/backend/models/registry.model'
import { REGISTRY_DISTRICT_LABELS } from '@/backend/lib/registry'
import { FACTION_META } from '@/frontend/lib/launch'
import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import { AngoUsername } from '@/frontend/components/ango/AngoUsername'
import styles from '@/frontend/components/registry/Registry.module.css'

export default async function SavedRegistryPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const posts = await RegistryModel.getSavedByUser(user.id)

  return (
    <>
      <Nav />
      <main style={{ paddingTop: '96px' }}>
        <div className="section-head">
          <p className="section-eyebrow">Saved Registry</p>
          <h1 className="section-title">
            Your <em>Filed Copies</em>
          </h1>
          <div className="ink-divider" />
          <p className="section-sub">
            Every report you save is stored here for later rereading. This is your private shelf of city records.
          </p>
        </div>

        <div className={styles.shell}>
          <div className={styles.controls} style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <Link href="/registry" className={styles.saveButtonSecondary + ' ' + styles.saveButton}>
              Back To Registry
            </Link>
            <Link href="/registry/submit" className={styles.saveButton}>
              Submit Report
            </Link>
          </div>

          <div className={styles.grid}>
            {posts.length ? (
              posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/registry/${encodeURIComponent(post.case_number)}`}
                  className={styles.card}
                >
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
                    <span className={styles.meta}>
                      {post.author_faction ? FACTION_META[post.author_faction].name : 'Unaffiliated'}
                    </span>
                  </div>
                  <p className={styles.excerpt}>{post.content.slice(0, 180)}...</p>
                  <div className={styles.statsRow}>
                    <span className={styles.counter}>{post.word_count} words</span>
                    <span className={styles.counter}>{post.save_count} saves</span>
                    <span className={styles.counter}>
                      {post.district ? REGISTRY_DISTRICT_LABELS[post.district] : 'Other'}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className={styles.identityCard}>
                No saved files yet. Open a Registry entry and use <em>Save File</em> to keep it here.
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
