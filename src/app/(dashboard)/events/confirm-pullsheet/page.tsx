import { ConfirmPullsheetForm } from '@/components/confirm-pullsheet-form'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function ConfirmPullsheetPage({ searchParams }: { searchParams: Promise<{ event_id?: string }> }) {
  const [profile, params] = await Promise.all([requireProfile(), searchParams])

  if (profile.role !== 'warehouse') {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Warehouse pullsheet photos only</h1>
        <p className="text-muted-foreground">Admin creates the event shell. Warehouse photographs and confirms the pullsheet.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select('id, name, event_date')
    .eq('org_id', profile.org_id)
    .is('pullsheet_confirmed_at', null)
    .order('event_date', { ascending: true })

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 to-slate-800 p-7 text-white shadow-sm sm:p-10">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/60">Warehouse</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Photograph pullsheet</h1>
        <p className="mt-4 max-w-2xl text-lg text-white/70">
          Take or upload a clear photo. Vision extracts the lines, then you review and lock the pullsheet for counting.
        </p>
      </div>
      <ConfirmPullsheetForm
        selectedEventId={params.event_id}
        events={(events ?? []).map((event) => ({ id: event.id, name: event.name, eventDate: event.event_date }))}
      />
    </div>
  )
}
