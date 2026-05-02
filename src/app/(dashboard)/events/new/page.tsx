import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { PullsheetForm } from '@/components/pullsheet-form'
import { buttonVariants } from '@/components/ui/button'

export default async function NewEventPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Admin</p>
          <h1 className="text-3xl font-semibold tracking-tight">Create event</h1>
        </div>
        <Link className={buttonVariants({ variant: 'outline' })} href="/events">
          Back to events
        </Link>
      </div>
      <PullsheetForm />
    </div>
  )
}
