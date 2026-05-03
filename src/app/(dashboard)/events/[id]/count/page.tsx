import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { EventRow, PullsheetItemRow } from '@/lib/supabase/types'
import { CountBoard, type CountRecordLite } from '@/components/count-board'
import { UnexpectedItemForm } from '@/components/unexpected-item-form'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CountPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (profile.role !== 'warehouse') {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Warehouse count only</h1>
        <p className="text-muted-foreground">Use the warehouse dev account to perform counts. Admin/viewer accounts can inspect the event detail page.</p>
        <Link className={buttonVariants({ variant: 'outline' })} href={`/events/${id}`}>Back to event</Link>
      </div>
    )
  }

  const { data: items } = await supabase
    .from('pullsheet_items')
    .select('id, event_id, sku, name, expected_qty, unit_price_cents, is_sealed_case, audit_flagged, category, alcohol_subcategory, section_label, is_unexpected, ops_review_status, image_url, created_at')
    .eq('event_id', id)
    .in('category', ['Alcohol', 'SOC Cocktail Mixers', 'Glassware', 'Named Sections'])
    .or('alcohol_subcategory.is.null,alcohol_subcategory.neq.Beer')
    .neq('ops_review_status', 'rejected')
    .order('created_at')

  const { data: counts } = await supabase
    .from('count_records')
    .select('id, pullsheet_item_id, counted_qty, audit_photo_url, shrinkage_resolution')
    .in('pullsheet_item_id', (items ?? []).map((item) => item.id))

  const typedEvent = event as EventRow
  const typedItems = (items ?? []) as PullsheetItemRow[]
  const typedCounts = (counts ?? []) as CountRecordLite[]
  const countByItem = new Map(typedCounts.map((count) => [count.pullsheet_item_id, count]))
  const allConfirmed = typedEvent.status === 'active' && typedItems.length > 0 && typedItems.every((item) => countByItem.has(item.id))

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link className={buttonVariants({ variant: 'link', className: 'h-auto p-0' })} href={`/events/${typedEvent.id}`}>← Event detail</Link>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Count: {typedEvent.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-muted-foreground">
            <span>{typedEvent.event_date}</span>
            <Badge variant={typedEvent.status === 'active' ? 'default' : 'secondary'}>{typedEvent.status}</Badge>
          </div>
        </div>
        {allConfirmed ? (
          <Link className={buttonVariants({ size: 'lg' })} href={`/events/${typedEvent.id}/report`}>
            Generate Report
          </Link>
        ) : null}
      </div>

      {!typedEvent.pullsheet_confirmed_at ? (
        <Card>
          <CardHeader>
            <CardTitle>Pullsheet not confirmed</CardTitle>
            <CardDescription>Confirm the pullsheet before warehouse counting begins.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <CountBoard eventId={typedEvent.id} items={typedItems} countByItem={countByItem} />
      {typedEvent.status === 'active' ? <UnexpectedItemForm eventId={typedEvent.id} /> : null}

      {typedItems.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-muted-foreground">No confirmed pullsheet items yet.</CardContent>
        </Card>
      ) : null}
    </div>
  )
}
