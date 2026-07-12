import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { EventForm } from '@/components/event-form'
import { buttonVariants } from '@/components/ui/button'

export default async function NewEventPage() {
  await requireAdmin()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Admin</p>
          <h1 className="text-4xl font-semibold tracking-tight">Create event</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Admin creates only the event name and date. Pullsheets now enter the system through the warehouse photo workflow.
          </p>
        </div>
        <Link className={buttonVariants({ variant: 'outline', size: 'lg' })} href="/events">
          Back to events
        </Link>
      </div>
      <EventForm />
    </div>
  )
}
