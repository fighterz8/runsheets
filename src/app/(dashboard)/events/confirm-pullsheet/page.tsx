import { ConfirmPullsheetForm } from '@/components/confirm-pullsheet-form'
import { requireProfile } from '@/lib/auth'

export default async function ConfirmPullsheetPage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const [profile, params] = await Promise.all([requireProfile(), searchParams])
  const source = params.source === 'warehouse_photo' ? 'warehouse_photo' : 'ops_upload'

  if (profile.role === 'viewer') {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Read-only access</h1>
        <p className="text-muted-foreground">Viewer accounts can inspect events but cannot confirm pullsheets.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{source === 'warehouse_photo' ? 'Warehouse pullsheet photo' : 'Ops manager upload'}</p>
        <h1 className="text-3xl font-semibold tracking-tight">Review before count begins</h1>
      </div>
      <ConfirmPullsheetForm source={source} />
    </div>
  )
}
