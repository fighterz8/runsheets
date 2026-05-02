'use client'

import { useActionState } from 'react'
import { createWarehousePullsheetAction } from '@/app/(dashboard)/events/actions'
import type { ParsedPullsheet } from '@/lib/pullsheet-parser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState: { message?: string } = {}

export function ConfirmPullsheetForm({ parsed }: { parsed: ParsedPullsheet }) {
  const [state, formAction, pending] = useActionState(createWarehousePullsheetAction, initialState)

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Confirm parsed pullsheet</CardTitle>
          <CardDescription>{parsed.note}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Event name</Label>
            <Input id="name" name="name" defaultValue={parsed.eventName} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event_date">Event date</Label>
            <Input id="event_date" name="event_date" type="date" defaultValue={parsed.eventDate} required />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
          <CardDescription>Correct these guesses before count begins.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {parsed.items.map((item, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-[1fr_120px]">
              <div className="space-y-1">
                <Label>Item name</Label>
                <Input name="item_name" defaultValue={item.name} required={index === 0} />
              </div>
              <div className="space-y-1">
                <Label>Expected</Label>
                <Input name="expected_qty" type="number" min="0" defaultValue={item.expectedQty} />
              </div>
            </div>
          ))}
          {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Confirm pullsheet'}</Button>
        </CardContent>
      </Card>
    </form>
  )
}
