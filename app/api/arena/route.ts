import { ArenaController } from '@/backend/controllers/arena.controller'
export async function GET() { return ArenaController.getActive() }
