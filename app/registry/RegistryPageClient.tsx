"use client"
import { ErrorBoundary } from '@/frontend/components/ui/ErrorBoundary'
import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import { RegistryFeed } from '@/frontend/components/registry/RegistryFeed'

export default function RegistryPageClient({ posts }: { posts: any }) {
  return (
    <ErrorBoundary>
      <Nav />
      <main style={{ paddingTop: '60px' }}>
        <div className="section-head">
          <p className="section-eyebrow">The Registry · Yokohama Incident Reports</p>
          <h1 className="section-title">
            Filed Reports. <em>Remembered Disturbances.</em>
          </h1>
          <div className="ink-divider" />
          <p className="section-sub">
            User-written incident files approved into the city record.
          </p>
        </div>
        <RegistryFeed initialPosts={posts} />
      </main>
      <Footer />
    </ErrorBoundary>
  )
}