import { FactionController } from '@/backend/controllers/faction.controller'
export async function GET() { return FactionController.getAll() }
