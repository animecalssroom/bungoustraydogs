import { NextRequest } from 'next/server'
import { SpecialDivisionController } from '@/backend/controllers/special-division.controller'

export async function POST(request: NextRequest) {
  return SpecialDivisionController.recommend(request)
}
