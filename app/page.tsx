import { HomeShowcase } from '@/frontend/components/home/HomeShowcase'
import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'

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
