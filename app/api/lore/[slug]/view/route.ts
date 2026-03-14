import { LoreController } from '@/backend/controllers/lore.controller'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
    return LoreController.incrementViews(params.slug)
}
