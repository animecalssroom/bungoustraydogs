import { notFound } from 'next/navigation'
import { createClient } from '@/frontend/lib/supabase/server'
import { RegistryModel } from '@/backend/models/registry.model'
import { DiscussionModel } from '@/backend/models/discussion.model'
import { REGISTRY_DISTRICT_LABELS } from '@/backend/lib/registry'
import { FACTION_META } from '@/frontend/lib/launch'
import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import { AngoUsername } from '@/frontend/components/ango/AngoUsername'
import { RegistrySaveButton } from '@/frontend/components/registry/RegistrySaveButton'
import { CommentThread } from '@/frontend/components/discussion/CommentThread'
import { FlagFileButton } from '@/frontend/components/support/FlagFileButton'
import styles from '@/frontend/components/registry/Registry.module.css'

async function getViewerId() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

export default async function RegistryCasePage({
  params,
}: {
  params: Promise<{ caseNumber: string }>
}) {
  const { caseNumber } = await params
  const viewerId = await getViewerId()
  const post = await RegistryModel.getByCaseNumber(decodeURIComponent(caseNumber), viewerId)
  const comments = await DiscussionModel.getRegistryComments(decodeURIComponent(caseNumber))

  if (!post) {
    notFound()
  }

  return (
    <>
      <Nav />
      <main style={{ paddingTop: '96px' }}>
        <div className={styles.caseWrap}>
          <article className={styles.caseFile}>
            <header className={styles.caseHeader}>
              <div>
                <p className={styles.meta}>Case File</p>
                <h1 className={styles.caseTitle}>{post.title}</h1>
                <p className={styles.helper}>{post.case_number}</p>
              </div>
              {post.featured ? <span className={`${styles.stamp} ${styles.featured}`}>Featured</span> : null}
            </header>

            <section className={styles.caseSection}>
              <p className={styles.sectionLabel}>Record Type</p>
              <p className={styles.body}>
                This page is a Registry filing: an in-world city record of an incident,
                observation, or operational report. Literary analysis belongs in Lore,
                not here.
              </p>
            </section>

            <section className={styles.caseSection}>
              <p className={styles.sectionLabel}>Filing Metadata</p>
              <div className={styles.metaRow}>
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
                <span className={styles.meta}>
                  {post.district ? REGISTRY_DISTRICT_LABELS[post.district] : 'Other'}
                </span>
              </div>
            </section>

            <section className={styles.caseSection}>
              <p className={styles.sectionLabel}>Incident Record</p>
              <div className={styles.body} style={{ whiteSpace: 'pre-wrap' }}>
                {post.content}
              </div>
            </section>

            <section className={styles.caseSection}>
              <p className={styles.sectionLabel}>Registry Actions</p>
              <RegistrySaveButton caseNumber={post.case_number} initialSaveCount={post.save_count} />
              <div style={{ marginTop: '0.9rem' }}>
                <FlagFileButton
                  entityType="registry_post"
                  entityId={post.id}
                  targetPath={`/registry/${encodeURIComponent(post.case_number)}`}
                  targetLabel={post.title}
                />
              </div>
            </section>

            <CommentThread
              title="Case Discussion"
              description="Use this thread to discuss the filing itself: continuity, motives, evidence, and what the city might have missed."
              endpoint={`/api/registry/${encodeURIComponent(post.case_number)}/comments`}
              initialComments={comments}
            />

            <div className={styles.identityCard}>
              Filed by {post.author_character ?? 'Unknown file'}
              {post.author_rank ? ` · ${post.author_rank}` : ''}
              {post.author_faction ? ` · ${FACTION_META[post.author_faction].name}` : ''}
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  )
}
