import Link from 'next/link'
import { LoreModel } from '@/backend/models/lore.model'
import { LorePageGridWithInitialPosts } from '@/frontend/components/lore/LoreCard'

export const revalidate = 120

export default async function LorePage() {
  const posts = await LoreModel.getAll()

  return (
    <>
      <div className="section-head">
        <p className="section-eyebrow">Literary Desk · Lore</p>
        <h1 className="section-title">
          The <em>Written Record</em>
        </h1>
        <div className="ink-divider" />
        <p className="section-sub">
          Lore is where the community writes essays: theories, character studies,
          arc analysis, author background, symbolism, and interpretation.
        </p>
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/lore/submit" className="btn-primary">
            Submit Lore
          </Link>
          <Link href="/guide" className="btn-secondary">
            Read City Guide
          </Link>
        </div>
      </div>

      <LorePageGridWithInitialPosts posts={posts} />

      <div className="section-wrap" style={{ paddingBottom: '2.5rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          <section
            style={{
              border: '1px solid var(--border)',
              background: 'var(--card)',
              padding: '1.5rem',
            }}
          >
            <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
              Use Lore For
            </p>
            <p className="section-sub" style={{ padding: 0 }}>
              Analysis, interpretation, theory-writing, real-author context, and
              reflective writing about Bungou Stray Dogs.
            </p>
          </section>

          <section
            style={{
              border: '1px solid var(--border)',
              background: 'var(--card)',
              padding: '1.5rem',
            }}
          >
            <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
              Not The Registry
            </p>
            <p className="section-sub" style={{ padding: 0 }}>
              If the piece reads like an in-world case filing with a district, case
              number, and incident framing, it belongs in the staff Registry desk instead.
            </p>
          </section>

          <section
            style={{
              border: '1px solid var(--border)',
              background: 'var(--card)',
              padding: '1.5rem',
            }}
          >
            <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
              Not The Registry
            </p>
            <p className="section-sub" style={{ padding: 0 }}>
              If the piece reads like an in-world case filing with a district, case
              number, and incident framing, it belongs in the staff Registry desk instead.
            </p>
          </section>

          <section
            style={{
              border: '1px solid var(--border)',
              background: 'var(--card)',
              padding: '1.5rem',
            }}
          >
            <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
              Lore Limits
            </p>
            <p className="section-sub" style={{ padding: 0 }}>
              Lore requires at least 50 words. Rank 1 files should stay within 200 words.
              Rank 2 and above can file up to 500 words before splitting a longer idea into
              a continuation entry.
            </p>
          </section>

          <section
            style={{
              border: '1px solid var(--border)',
              background: 'var(--card)',
              padding: '1.5rem',
            }}
          >
            <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
              How Lore Helps
            </p>
            <p className="section-sub" style={{ padding: 0 }}>
              Lore deepens the literary side of the city. It helps other users understand BSD,
              contributes to your visible activity, and builds the analytical side of your file.
            </p>
            <div style={{ marginTop: '1rem' }}>
              <Link href="/guide" className="btn-secondary">
                Read the City Guide
              </Link>
            </div>
          </section>

          <section
            style={{
              border: '1px solid var(--border)',
              background: 'var(--card)',
              padding: '1.5rem',
            }}
          >
            <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
              Write Lore
            </p>
            <p className="section-sub" style={{ padding: 0 }}>
              Publish essays, character studies, theory, symbolism, and literary context here.
              If it reads like an in-world incident file, keep it for the staff Registry desk instead.
            </p>
            <div style={{ marginTop: '1rem' }}>
              <Link href="/lore/submit" className="btn-primary">
                Open Literary Desk
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
