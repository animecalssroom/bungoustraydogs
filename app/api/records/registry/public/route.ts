import { NextResponse } from 'next/server'
import { RegistryModel } from '@/backend/models/registry.model'
import type { FactionId, RegistryDistrict } from '@/backend/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const faction = searchParams.get('faction') as FactionId | 'all' | null
  const district = searchParams.get('district') as RegistryDistrict | 'all' | null
  const sort = searchParams.get('sort') as 'recent' | 'saved' | 'featured' | null
  const limit = parseInt(searchParams.get('limit') || '50')
  const page = parseInt(searchParams.get('page') || '0')

  const posts = await RegistryModel.getPublic({
    faction: faction || 'all',
    district: district || 'all',
    sort: sort || 'recent',
    limit,
    page
  })

  return NextResponse.json({ data: posts })
}
