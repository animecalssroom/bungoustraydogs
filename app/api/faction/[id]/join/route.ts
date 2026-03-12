import { FactionController } from '@/backend/controllers/faction.controller'

export async function POST() {
  return FactionController.join()
}
