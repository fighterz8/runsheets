import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/auth'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const profile = await getSessionProfile()

  if (profile) {
    redirect('/events')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <LoginForm />
    </main>
  )
}
