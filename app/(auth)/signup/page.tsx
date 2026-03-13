import LoginPage from '../login/page'

export default function SignupPage() {
  // Render login page with signup mode by default
  return <LoginPage initialMode="signup" />
}
