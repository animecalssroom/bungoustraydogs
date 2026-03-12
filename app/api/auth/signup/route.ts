import { NextRequest } from 'next/server'
import { AuthController } from '@/backend/controllers/auth.controller'
export async function POST(req: NextRequest) { return AuthController.signup(req) }
