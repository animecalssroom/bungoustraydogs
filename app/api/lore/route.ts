import { NextRequest } from 'next/server'
import { LoreController } from '@/backend/controllers/lore.controller'
export async function GET(req: NextRequest) { return LoreController.getAll(req) }
export async function POST(req: NextRequest) { return LoreController.create(req) }
