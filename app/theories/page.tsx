import { redirect } from 'next/navigation'

export default function TheoriesPage() {
  redirect('/records?tab=lore')
}
