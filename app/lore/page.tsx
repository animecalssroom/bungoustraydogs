import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import { LorePageGrid } from '@/frontend/components/lore/LoreCard'

export default function LorePage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: '60px' }}>
        <div className="section-head">
          <p className="section-eyebrow">文学 · Lore</p>
          <h1 className="section-title">The <em>Written Record</em></h1>
          <div className="ink-divider" />
          <p className="section-sub">Deep dives, theories, character studies. The archive written by the community.</p>
        </div>
        <LorePageGrid />
      </main>
      <Footer />
    </>
  )
}
