import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { PullsheetForm } from '@/components/pullsheet-form'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function NewEventPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Admin</p>
          <h1 className="text-3xl font-semibold tracking-tight">Create event</h1>
        </div>
        <Link className={buttonVariants({ variant: 'outline' })} href="/events">
          Back to events
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload pullsheet first</CardTitle>
            <CardDescription>Excel/photo parsing will populate guesses, then ops confirms before saving.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className={buttonVariants({ variant: 'outline' })} href="/events/confirm-pullsheet?source=ops_upload">
              Start upload review
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Skip upload</CardTitle>
            <CardDescription>Create just the event and manual line items; warehouse can photograph the physical pullsheet later.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Use the form below for manual creation.</p>
          </CardContent>
        </Card>
      </div>
      <PullsheetForm />
    </div>
  )
}
