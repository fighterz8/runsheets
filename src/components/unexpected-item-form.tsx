'use client'

import { useActionState } from 'react'
import { flagUnexpectedItemAction } from '@/app/(dashboard)/events/[id]/count/actions'
import { ALCOHOL_SUBCATEGORIES } from '@/lib/pullsheet-categories'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState: { message?: string } = {}

export function UnexpectedItemForm({ eventId }: { eventId: string }) {
  const [state, formAction, pending] = useActionState(flagUnexpectedItemAction, initialState)

  return (
    <Card className="rounded-[2rem]">
      <CardHeader>
        <CardTitle>Unexpected item?</CardTitle>
        <CardDescription>Flag it for ops review. It appears as a yellow unconfirmed tile with expected qty 0.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_160px_120px_auto]">
          <input type="hidden" name="event_id" value={eventId} />
          <div className="space-y-2">
            <Label>Item name</Label>
            <Input name="name" placeholder="e.g. Don Julio Blanco" required />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <select name="alcohol_subcategory" className="min-h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs">
              {ALCOHOL_SUBCATEGORIES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Count</Label>
            <Input name="counted_qty" type="number" min="0" defaultValue="1" />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={pending}>{pending ? 'Flagging…' : 'Flag item'}</Button>
          </div>
          {state.message ? <p className="text-sm text-destructive sm:col-span-4">{state.message}</p> : null}
        </form>
      </CardContent>
    </Card>
  )
}
