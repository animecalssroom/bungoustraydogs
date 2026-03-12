import { NextRequest } from 'next/server'
import { CharacterController } from '@/backend/controllers/character.controller'
export async function GET(req: NextRequest) { return CharacterController.getAll(req) }
