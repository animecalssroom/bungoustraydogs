import { redirect } from 'next/navigation'

export default function LorePostRedirect({ params }: { params: { slug: string } }) {
  redirect(`/records/lore/${params.slug}`)
}
