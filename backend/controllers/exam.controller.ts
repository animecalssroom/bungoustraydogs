import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { UserModel } from '@/backend/models/user.model'

export const ExamController = {
  async beginRetake(req: NextRequest) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    const result = await UserModel.beginExamRetake(auth.user.id)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json(result)
  },
}
