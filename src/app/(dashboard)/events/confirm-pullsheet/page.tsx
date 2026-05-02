import { ConfirmPullsheetForm } from '@/components/confirm-pullsheet-form'
import { parsePullsheetUpload } from '@/lib/pullsheet-parser'
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

  const parsed = await parsePullsheetUpload(null)
  parsed.note = source === 'warehouse_photo'
    ? 'Warehouse photo parsing placeholder. Photograph upload will route here, then OpenAI Vision will populate guesses.'
    : 'Ops upload parsing placeholder. Excel/photo upload will route here, then SheetJS or OpenAI Vision will populate guesses.'

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{source === 'warehouse_photo' ? 'Warehouse pullsheet photo' : 'Ops manager upload'}</p>
        <h1 className="text-3xl font-semibold tracking-tight">Review before count begins</h1>
      </div>
      <ConfirmPullsheetForm parsed={parsed} />
    </div>
  )
}
