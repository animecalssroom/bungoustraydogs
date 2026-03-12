import { NextRequest } from 'next/server'
import { AssignmentController } from '@/backend/controllers/assignment.controller'

export async function GET(request: NextRequest) {
  return AssignmentController.getMine(request)
}

export async function POST(request: NextRequest) {
  return AssignmentController.create(request)
}
