import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { validate } from '@/backend/middleware/validate'
import { REGISTRY_DISTRICTS } from '@/backend/lib/registry'
import { RegistryModel } from '@/backend/models/registry.model'
import type { FactionId, RegistryDistrict } from '@/backend/types'

const RegistryDistrictSchema = z.enum([
  'kannai',
  'chinatown',
  'harbor',
  'motomachi',
  'honmoku',
  'waterfront',
  'other',
])

const RegistryCreateSchema = z.object({
  title: z.string().min(5).max(160),
  district: RegistryDistrictSchema,
  content: z.string().min(200),
})

const RegistryReviewSchema = z.object({
  action: z.enum(['approve', 'review', 'reject']),
  note: z.string().max(400).optional(),
  feature: z.boolean().optional(),
})

export const RegistryController = {
  async getAll(req: NextRequest) {
    const faction = (req.nextUrl.searchParams.get('faction') as FactionId | 'all' | null) ?? 'all'
    const district = req.nextUrl.searchParams.get('district') as
      | (typeof REGISTRY_DISTRICTS)[number]
      | 'all'
      | null
    const sort = (req.nextUrl.searchParams.get('sort') as 'recent' | 'saved' | 'featured' | null) ?? 'recent'
    const posts = await RegistryModel.getPublic({
      faction,
      district: district ?? 'all',
      sort,
    })

    return NextResponse.json({ data: posts })
  },

  async create(req: NextRequest) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    if (!['member', 'mod', 'owner'].includes(auth.profile.role) || auth.profile.rank < 2) {
      return NextResponse.json(
        { error: 'Registry submission requires rank 2 or higher.' },
        { status: 403 },
      )
    }

    const body = await req.json().catch(() => ({}))
    const parsed = validate(RegistryCreateSchema, body)
    if (!parsed.success) return parsed.response

    const result = await RegistryModel.createSubmission(auth.profile, {
      ...parsed.data,
      district: parsed.data.district as RegistryDistrict,
    })

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data }, { status: 201 })
  },

  async getMinePending(req: NextRequest) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    const posts = await RegistryModel.getPendingForFaction(
      (auth.profile.faction ?? 'agency') as FactionId,
      auth.profile,
    )

    return NextResponse.json({ data: posts })
  },

  async save(req: NextRequest, caseNumber: string) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    const result = await RegistryModel.savePost(caseNumber, auth.user.id)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data })
  },

  async review(req: NextRequest, postId: string) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    const body = await req.json().catch(() => ({}))
    const parsed = validate(RegistryReviewSchema, body)
    if (!parsed.success) return parsed.response

    const result = await RegistryModel.reviewPost(auth.profile, postId, parsed.data)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data })
  },
}
