import Link from 'next/link'
import { notFound } from 'next/navigation'
import { activateEventAction } from '../actions'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { EventRow, PullsheetItemRow } from '@/lib/supabase/types'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, profile] = await Promise.all([params, requireProfile()])
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, org_id, name, event_date, status, created_by, created_at, closed_at')
    .eq('id', id)
    .single()

  if (!event) {
    notFound()
  }

  const { data: items, error: itemsError } = await supabase
    .from('pullsheet_items')
    .select('id, event_id, sku, name, expected_qty, unit_price_cents, is_sealed_case, audit_flagged, created_at')
    .eq('event_id', id)
    .order('created_at')

  const typedEvent = event as EventRow
  const typedItems = (items ?? []) as PullsheetItemRow[]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link className={buttonVariants({ variant: 'link', className: 'h-auto p-0' })} href="/events">← Events</Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{typedEvent.name}</h1>
            <Badge variant={typedEvent.status === 'active' ? 'default' : 'secondary'}>{typedEvent.status}</Badge>
          </div>
          <p className="text-muted-foreground">{typedEvent.event_date}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {profile.role === 'admin' && typedEvent.status === 'draft' ? (
            <form action={activateEventAction}>
              <input type="hidden" name="event_id" value={typedEvent.id} />
              <Button type="submit">Activate for counting</Button>
            </form>
          ) : null}
          <Link className={buttonVariants({ variant: 'outline' })} href={`/events/${typedEvent.id}/count`}>Open count view</Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pullsheet</CardTitle>
          <CardDescription>{typedItems.length} item{typedItems.length === 1 ? '' : 's'} expected back.</CardDescription>
        </CardHeader>
        <CardContent>
          {itemsError ? <p className="text-sm text-destructive">{itemsError.message}</p> : null}
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Expected</th>
                  <th className="px-4 py-3 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody>
                {typedItems.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.sku ?? '—'}</td>
                    <td className="px-4 py-3">{item.expected_qty}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {item.is_sealed_case ? <Badge variant="secondary">sealed</Badge> : null}
                        {item.audit_flagged ? <Badge variant="outline">audit</Badge> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
