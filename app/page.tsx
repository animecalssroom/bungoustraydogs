import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import { HomeShowcase } from '@/frontend/components/home/HomeShowcase'

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <HomeShowcase />
      </main>
      <Footer />
    </>
  )
}
