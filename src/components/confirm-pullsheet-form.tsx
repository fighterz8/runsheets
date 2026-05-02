'use client'

import { useActionState, useRef, useState } from 'react'
import { createWarehousePullsheetAction } from '@/app/(dashboard)/events/actions'
import { parsePullsheetAction } from '@/app/(dashboard)/events/confirm-pullsheet/actions'
import type { ParsedPullsheet } from '@/lib/pullsheet-parser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const saveInitialState: { message?: string } = {}
const parseInitialState = {
  parsed: {
    eventName: '',
    eventDate: '',
    items: [],
    note: 'No photo parsed yet.',
    source: 'empty' as const,
  },
}

type EventOption = {
  id: string
  name: string
  eventDate: string
}

function PullsheetEditor({ parsed, events, selectedEventId }: { parsed: ParsedPullsheet; events: EventOption[]; selectedEventId?: string }) {
  const [rows, setRows] = useState(parsed.items)
  const [saveState, saveAction, saving] = useActionState(createWarehousePullsheetAction, saveInitialState)

  return (
    <form action={saveAction} className="space-y-6">
      <Card className="rounded-[2rem] border-border/60 shadow-sm">
        <CardHeader className="p-6 sm:p-8">
          <CardTitle className="text-2xl">Review Vision results</CardTitle>
          <CardDescription>{parsed.note}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-6 pt-0 sm:p-8 sm:pt-0">
          <div className="space-y-2">
            <Label htmlFor="event_id">Event</Label>
            <select
              id="event_id"
              name="event_id"
              defaultValue={selectedEventId ?? ''}
              required
              className="min-h-12 w-full rounded-xl border border-input bg-background px-4 text-base shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>Select event…</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.name} — {event.eventDate}</option>
              ))}
            </select>
          </div>
          {events.length === 0 ? (
            <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              No blank events are waiting for a pullsheet. Create an event with just name and date first.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-border/60 shadow-sm">
        <CardHeader className="p-6 sm:p-8">
          <CardTitle className="text-2xl">Line items</CardTitle>
          <CardDescription>Correct Vision mistakes here. Saving locks this pullsheet for counting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6 pt-0 sm:p-8 sm:pt-0">
          {rows.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-3xl border bg-background p-4 shadow-xs sm:grid-cols-[1fr_140px_140px_auto]">
              <div className="space-y-2">
                <Label>Item name</Label>
                <Input name="item_name" defaultValue={item.name} required={index === 0} />
              </div>
              <div className="space-y-2">
                <Label>Expected</Label>
                <Input name="expected_qty" type="number" min="0" defaultValue={item.expectedQty} />
              </div>
              <div className="space-y-2">
                <Label>Unit price</Label>
                <Input name="unit_price" type="number" min="0" step="0.01" defaultValue={item.unitPrice} />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                  disabled={rows.length === 1}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" size="lg" variant="outline" onClick={() => setRows((current) => [...current, { name: '', expectedQty: 0, unitPrice: 0 }])}>
              Add row
            </Button>
            <Button type="submit" size="lg" disabled={saving || events.length === 0}>{saving ? 'Saving…' : 'Lock pullsheet'}</Button>
          </div>
          {saveState.message ? <p className="text-sm text-destructive">{saveState.message}</p> : null}
        </CardContent>
      </Card>
    </form>
  )
}

export function ConfirmPullsheetForm({ events, selectedEventId }: { events: EventOption[]; selectedEventId?: string }) {
  const [parseState, parseAction, parsing] = useActionState(parsePullsheetAction, parseInitialState)
  const parsed = parseState?.parsed ?? parseInitialState.parsed
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-border/60 shadow-sm">
        <CardHeader className="p-6 sm:p-8">
          <CardTitle className="text-2xl">Photo input</CardTitle>
          <CardDescription>
            Take a picture on tablet, or upload an existing image while testing. The photo is read with Vision; spreadsheet upload comes later.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
          <form action={parseAction} className="space-y-4">
            <input type="hidden" name="source" value="warehouse_photo" />
            <Input ref={cameraInputRef} id="pullsheet-camera" name="pullsheet" type="file" accept="image/*" capture="environment" className="sr-only" />
            <Input ref={uploadInputRef} id="pullsheet-upload" name="pullsheet" type="file" accept="image/*" className="sr-only" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="button" size="lg" className="min-h-16 rounded-2xl text-base" onClick={() => cameraInputRef.current?.click()}>
                Take picture
              </Button>
              <Button type="button" size="lg" variant="outline" className="min-h-16 rounded-2xl text-base" onClick={() => uploadInputRef.current?.click()}>
                Upload photo for testing
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">After choosing a photo, tap Read with Vision.</p>
            <Button type="submit" size="lg" className="w-full" disabled={parsing}>{parsing ? 'Reading photo…' : 'Read with Vision'}</Button>
          </form>
          {parseState.message ? <p className="mt-4 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">{parseState.message}</p> : null}
        </CardContent>
      </Card>
      {parsed.source !== 'empty' && parsed.items.length > 0 ? (
        <PullsheetEditor parsed={parsed} events={events} selectedEventId={selectedEventId} />
      ) : null}
    </div>
  )
}
