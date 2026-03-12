import { NextRequest, NextResponse } from 'next/server'
import { UserModel } from '@/backend/models/user.model'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'

export const UserController = {
  async getProfile(username: string) {
    const profile = await UserModel.getByUsername(username)
    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: profile })
  },
  
  async updateMe(req: NextRequest) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth
    
    const body = await req.json()
    const allowed = ['bio', 'avatar_url', 'theme']
    const updates = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    )
    
    const updated = await UserModel.update(auth.user.id, updates)
    return NextResponse.json({ data: updated })
  },
}
