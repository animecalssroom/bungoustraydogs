import { LoreController } from '@/backend/controllers/lore.controller'
export async function GET(_: Request, { params }: { params: { slug: string } }) {
  return LoreController.getBySlug(params.slug)
}
