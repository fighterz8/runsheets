import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/auth'
import { buttonVariants } from '@/components/ui/button'

export default async function Home() {
  const profile = await getSessionProfile()

  if (profile) {
    redirect('/events')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <section className="max-w-2xl space-y-6 rounded-3xl border bg-background p-8 text-center shadow-sm">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">Runsheets</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Event return reconciliation for catering teams.
          </h1>
          <p className="text-lg text-muted-foreground">
            Create an event, enter the pullsheet, and give warehouse staff a clean count flow after service.
          </p>
        </div>
        <a className={buttonVariants({ size: 'lg' })} href="/login">Sign in</a>
      </section>
    </main>
  )
}
