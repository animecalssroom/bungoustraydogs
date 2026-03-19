import { redirect } from 'next/navigation'
import { OwnerModel } from '@/backend/models/owner.model'
import { ReservedCharacterDesk } from '@/frontend/components/owner/ReservedCharacterDesk'
import { getViewerProfile } from '@/frontend/lib/auth-server'


export default async function OwnerAssignCharacterPage() {
  const viewer = await getViewerProfile()

  if (!viewer) {
    redirect('/login')
  }

  if (viewer.role !== 'owner') {
    redirect('/')
  }

  const data = await OwnerModel.getReservedAssignmentData()

  return (
    <div style={{ paddingTop: '36px' }}>
      <section className="section-wrap" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
        <ReservedCharacterDesk
          users={data.users}
          reservedCharacters={data.reservedCharacters}
        />
      </section>
    </div>
  )
}
