import { AuthController } from '@/backend/controllers/auth.controller'
export async function GET() { return AuthController.me() }
