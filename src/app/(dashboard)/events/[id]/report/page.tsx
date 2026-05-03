import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, profile] = await Promise.all([params, requireProfile()])

  if (profile.role === 'warehouse') {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Reports are ops only</h1>
        <p className="text-muted-foreground">Warehouse users can count inventory but cannot access PDF reconciliation reports.</p>
        <Link className={buttonVariants({ variant: 'outline' })} href={`/events/${id}/count`}>Back to count</Link>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory PDF report</CardTitle>
        <CardDescription>Includes Snake Oil header, expected vs counted, shrinkage by category, and broken/missing callouts.</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Link className={buttonVariants({ size: 'lg' })} href={`/api/events/${id}/report`} target="_blank">Open PDF</Link>
        <Link className={buttonVariants({ variant: 'outline', size: 'lg' })} href={`/events/${id}`}>Back to event</Link>
      </CardContent>
    </Card>
  )
}
