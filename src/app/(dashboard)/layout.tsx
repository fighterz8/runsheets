import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import { logoutAction } from '@/app/(auth)/login/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireProfile()

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="space-y-1">
            <Link href="/events" className="text-xl font-semibold tracking-tight">
              Runsheets
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{profile.email}</span>
              <Badge variant="secondary">{profile.role}</Badge>
            </div>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline">Sign out</Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
