import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import { FactionPageGrid } from '@/frontend/components/faction/FactionCard'
import { FactionModel } from '@/backend/models/faction.model'

export default async function FactionsPage() {
  const factions = await FactionModel.getAll()

  return (
    <>
      <Nav />
      <main style={{ paddingTop: '60px' }}>
        <div className="section-head">
          <p className="section-eyebrow">派閥 · Factions of Yokohama</p>
          <h1 className="section-title">
            Public Files. <em>Sealed Rooms.</em>
          </h1>
          <div className="ink-divider" />
          <p className="section-sub">
            Everyone can read the dossiers. Only assigned members can cross the inner threshold.
          </p>
        </div>
        <FactionPageGrid factions={factions} />
      </main>
      <Footer />
    </>
  )
}
