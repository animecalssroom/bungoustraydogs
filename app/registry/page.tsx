import { redirect } from 'next/navigation'

export default function RegistryRedirect() {
  redirect('/records?tab=field-notes')
}
