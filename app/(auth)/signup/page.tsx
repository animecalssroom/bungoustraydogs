import { redirect } from 'next/navigation'

export default function SignupPage() {
  // Redirect to login page with signup mode as a query param
  redirect('/auth/login?mode=signup')
}
