import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { EventRow } from '@/lib/supabase/types'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function EventsPage() {
  const profile = await requireProfile()
  const supabase = await createClient()
  const { data: events, error } = await supabase
    .from('events')
    .select('id, org_id, name, event_date, status, created_by, created_at, closed_at')
    .order('event_date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Snake Oil Cocktail Co.</p>
          <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
        </div>
        {profile.role === 'admin' ? (
          <Link className={buttonVariants()} href="/events/new">Create event</Link>
        ) : null}
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Could not load events</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {((events ?? []) as EventRow[]).map((event) => (
          <Card key={event.id}>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{event.name}</CardTitle>
                <CardDescription>
                  {new Date(`${event.event_date}T00:00:00`).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </CardDescription>
              </div>
              <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>{event.status}</Badge>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link className={buttonVariants({ variant: 'outline' })} href={`/events/${event.id}`}>
                Open
              </Link>
              <Link className={buttonVariants({ variant: 'outline' })} href={`/events/${event.id}/count`}>
                Count view
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {!error && (events?.length ?? 0) === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No events yet</CardTitle>
            <CardDescription>Create a draft event with a manual pullsheet to start testing auth + RLS.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  )
}
