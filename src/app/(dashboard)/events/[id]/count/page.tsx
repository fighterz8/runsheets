import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { EventRow, PullsheetItemRow } from '@/lib/supabase/types'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CountPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }] = await Promise.all([params, requireProfile()])
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, org_id, name, event_date, status, created_by, created_at, closed_at, pullsheet_source, pullsheet_confirmed_at, pullsheet_confirmed_by')
    .eq('id', id)
    .single()

  if (!event) {
    notFound()
  }

  const { data: items } = await supabase
    .from('pullsheet_items')
    .select('id, event_id, sku, name, expected_qty, unit_price_cents, is_sealed_case, audit_flagged, created_at')
    .eq('event_id', id)
    .order('created_at')

  const typedEvent = event as EventRow
  const typedItems = (items ?? []) as PullsheetItemRow[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link className={buttonVariants({ variant: 'link', className: 'h-auto p-0' })} href={`/events/${typedEvent.id}`}>← Event detail</Link>
          <h1 className="text-3xl font-semibold tracking-tight">Count: {typedEvent.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-muted-foreground">
            <span>{typedEvent.event_date}</span>
            <Badge variant={typedEvent.status === 'active' ? 'default' : 'secondary'}>{typedEvent.status}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {typedItems.map((item) => (
          <Card key={item.id} className="min-h-40">
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
              <CardDescription>{item.sku ?? 'No SKU'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-semibold">Expected: {item.expected_qty}</p>
              <div className="flex gap-2">
                {item.is_sealed_case ? <Badge variant="secondary">sealed case</Badge> : null}
                {item.audit_flagged ? <Badge variant="outline">audit photo</Badge> : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
