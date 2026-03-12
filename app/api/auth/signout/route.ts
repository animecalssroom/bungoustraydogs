import { AuthController } from '@/backend/controllers/auth.controller'
export async function POST() { return AuthController.signout() }
