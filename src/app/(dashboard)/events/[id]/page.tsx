import Link from 'next/link'
import { notFound } from 'next/navigation'
import { activateEventAction, clearPullsheetAction, deleteDraftEventAction } from '../actions'
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
    .select('id, org_id, name, event_date, status, created_by, created_at, closed_at, pullsheet_source, pullsheet_confirmed_at, pullsheet_confirmed_by')
    .eq('id', id)
    .single()

  if (!event) {
    notFound()
  }

  const { data: items, error: itemsError } = await supabase
    .from('pullsheet_items')
    .select('id, event_id, sku, name, expected_qty, unit_price_cents, is_sealed_case, audit_flagged, category, alcohol_subcategory, section_label, created_at')
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
          {profile.role === 'warehouse' && !typedEvent.pullsheet_confirmed_at ? (
            <Link className={buttonVariants({ size: 'lg' })} href={`/events/confirm-pullsheet?event_id=${typedEvent.id}`}>
              Photograph pullsheet
            </Link>
          ) : null}
          {profile.role === 'admin' && typedEvent.status === 'draft' && typedEvent.pullsheet_confirmed_at ? (
            <form action={activateEventAction}>
              <input type="hidden" name="event_id" value={typedEvent.id} />
              <Button type="submit">Activate for counting</Button>
            </form>
          ) : null}
          <Link className={buttonVariants({ variant: 'outline', size: 'lg' })} href={`/events/${typedEvent.id}/count`}>Open count view</Link>
          {(profile.role === 'warehouse' || profile.role === 'admin') && typedEvent.status === 'draft' && typedEvent.pullsheet_confirmed_at ? (
            <form action={clearPullsheetAction}>
              <input type="hidden" name="event_id" value={typedEvent.id} />
              <Button type="submit" variant="outline">Clear pullsheet</Button>
            </form>
          ) : null}
          {(profile.role === 'warehouse' || profile.role === 'admin') && typedEvent.status === 'draft' ? (
            <form action={deleteDraftEventAction}>
              <input type="hidden" name="event_id" value={typedEvent.id} />
              <Button type="submit" variant="destructive">Delete draft</Button>
            </form>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pullsheet</CardTitle>
          <CardDescription>
            {typedItems.length} item{typedItems.length === 1 ? '' : 's'} expected back. Source: {typedEvent.pullsheet_source.replace('_', ' ')}.
            {typedEvent.pullsheet_confirmed_at ? ' Confirmed.' : ' Awaiting confirmation before count begins.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {itemsError ? <p className="text-sm text-destructive">{itemsError.message}</p> : null}
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Section</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Expected</th>
                  <th className="px-4 py-3 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody>
                {typedItems.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{item.category}</Badge>
                        {item.alcohol_subcategory ? <Badge variant="outline">{item.alcohol_subcategory}</Badge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.section_label}</td>
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
