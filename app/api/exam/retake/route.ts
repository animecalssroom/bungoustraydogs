import { NextRequest } from 'next/server'
import { ExamController } from '@/backend/controllers/exam.controller'

export async function POST(request: NextRequest) {
  return ExamController.beginRetake(request)
}
