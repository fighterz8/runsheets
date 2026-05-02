'use client'

import { useActionState, useState } from 'react'
import { createEventAction } from '@/app/(dashboard)/events/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const initialState: { message?: string } = {}

export function PullsheetForm() {
  const [rows, setRows] = useState([0, 1, 2])
  const [state, formAction, pending] = useActionState(createEventAction, initialState)

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
          <CardDescription>Create a draft event manually when ops skips pullsheet upload.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Event name</Label>
            <Input id="name" name="name" placeholder="Jones wedding" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event_date">Event date</Label>
            <Input id="event_date" name="event_date" type="date" required />
          </div>
          <input type="hidden" name="pullsheet_source" value="manual" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pullsheet items</CardTitle>
          <CardDescription>Enter the items expected to return from the event.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="hidden grid-cols-[1fr_1.5fr_110px_130px_110px_100px] gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
            <span>SKU</span>
            <span>Name</span>
            <span>Expected</span>
            <span>Unit price</span>
            <span>Sealed</span>
            <span>Audit</span>
          </div>
          {rows.map((row, displayIndex) => (
            <div key={row} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_1.5fr_110px_130px_110px_100px] md:border-0 md:p-0">
              <div className="space-y-1 md:space-y-0">
                <Label className="md:hidden">SKU</Label>
                <Input name="sku" placeholder="Optional" />
              </div>
              <div className="space-y-1 md:space-y-0">
                <Label className="md:hidden">Name</Label>
                <Input name="item_name" placeholder="750ml tequila" required={displayIndex === 0} />
              </div>
              <div className="space-y-1 md:space-y-0">
                <Label className="md:hidden">Expected</Label>
                <Input name="expected_qty" type="number" min="0" defaultValue="0" />
              </div>
              <div className="space-y-1 md:space-y-0">
                <Label className="md:hidden">Unit price</Label>
                <Input name="unit_price" type="number" min="0" step="0.01" defaultValue="0.00" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input name="is_sealed_case" value={displayIndex} type="checkbox" className="size-4" />
                Sealed
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input name="audit_flagged" value={displayIndex} type="checkbox" className="size-4" />
                Audit
              </label>
            </div>
          ))}
          <Separator />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setRows((current) => [...current, Date.now()])}>
              Add item row
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Creating…' : 'Create draft event'}
            </Button>
          </div>
          {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
        </CardContent>
      </Card>
    </form>
  )
}
