import { NextRequest, NextResponse } from 'next/server'
import { WarModel } from '@/backend/models/war.model'
import { requireAuth } from '@/backend/middleware/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const territories = await WarModel.getTerritoryControl()
        const status = await WarModel.getWarStatus()

        return NextResponse.json({
            territories,
            status
        })
    } catch (err) {
        console.error('[war-api] error:', err)
        return NextResponse.json({ error: 'Failed to retrieve war intelligence.' }, { status: 500 })
    }
}
