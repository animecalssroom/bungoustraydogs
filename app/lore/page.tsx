import { redirect } from 'next/navigation'

export default function LoreRedirect() {
  redirect('/records?tab=lore')
}
