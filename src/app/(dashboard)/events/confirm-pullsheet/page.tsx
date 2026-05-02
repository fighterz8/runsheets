import { ConfirmPullsheetForm } from '@/components/confirm-pullsheet-form'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export const maxDuration = 60

export default async function ConfirmPullsheetPage({ searchParams }: { searchParams: Promise<{ event_id?: string }> }) {
  const [profile, params] = await Promise.all([requireProfile(), searchParams])

  if (profile.role === 'viewer') {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Read-only access</h1>
        <p className="text-muted-foreground">Viewer accounts can inspect events but cannot upload pullsheets.</p>
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
      <Link className={buttonVariants({ variant: 'link', className: 'h-auto p-0' })} href={params.event_id ? `/events/${params.event_id}` : '/events'}>← Go back</Link>
      <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 to-slate-800 p-7 text-white shadow-sm sm:p-10">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/60">{profile.role === 'admin' ? 'Admin test path' : 'Warehouse'}</p>
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
