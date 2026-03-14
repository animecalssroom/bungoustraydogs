import { ArchiveModel } from '@/backend/models/archive.model'
import { ArchiveIndex } from '@/frontend/components/archive/ArchiveIndex'

export const revalidate = 300

export default async function ArchivePage() {
  const entries = await ArchiveModel.getAll()

  return (
    <div style={{ paddingTop: '36px' }}>
      <div className="section-head">
        <p className="section-eyebrow">Archive · Public Registry</p>
        <h1 className="section-title">
          The <em>Case Files</em>
        </h1>
        <div className="ink-divider" />
        <p className="section-sub">
          Ability users, literary origins, and the records Yokohama keeps open to everyone.
        </p>
      </div>
      <ArchiveIndex entries={entries} />
    </div>
  )
}
