'use client'

import { useActionState, useState } from 'react'
import { createWarehousePullsheetAction } from '@/app/(dashboard)/events/actions'
import { initialParseState, parsePullsheetAction } from '@/app/(dashboard)/events/confirm-pullsheet/actions'
import type { ParsedPullsheet } from '@/lib/pullsheet-parser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const saveInitialState: { message?: string } = {}

function PullsheetEditor({ parsed }: { parsed: ParsedPullsheet }) {
  const [rows, setRows] = useState(parsed.items.length ? parsed.items : [{ name: '', expectedQty: 0, unitPrice: 0 }])
  const [saveState, saveAction, saving] = useActionState(createWarehousePullsheetAction, saveInitialState)

  return (
    <form action={saveAction} className="space-y-6">
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
          <CardDescription>Add, remove, or edit rows. Saving locks this pullsheet for counting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_120px_130px_auto]">
              <div className="space-y-1">
                <Label>Item name</Label>
                <Input name="item_name" defaultValue={item.name} required={index === 0} />
              </div>
              <div className="space-y-1">
                <Label>Expected</Label>
                <Input name="expected_qty" type="number" min="0" defaultValue={item.expectedQty} />
              </div>
              <div className="space-y-1">
                <Label>Unit price</Label>
                <Input name="unit_price" type="number" min="0" step="0.01" defaultValue={item.unitPrice} />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                  disabled={rows.length === 1}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setRows((current) => [...current, { name: '', expectedQty: 0, unitPrice: 0 }])}>
              Add row
            </Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Lock pullsheet and save event'}</Button>
          </div>
          {saveState.message ? <p className="text-sm text-destructive">{saveState.message}</p> : null}
        </CardContent>
      </Card>
    </form>
  )
}

export function ConfirmPullsheetForm({ source }: { source: 'ops_upload' | 'warehouse_photo' }) {
  const [parseState, parseAction, parsing] = useActionState(parsePullsheetAction, initialParseState)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{source === 'warehouse_photo' ? 'Upload pullsheet photo' : 'Upload pullsheet file'}</CardTitle>
          <CardDescription>
            {source === 'warehouse_photo'
              ? 'Upload a pullsheet image. OpenAI Vision will return editable guesses.'
              : 'Upload .xlsx or .csv. The parser will guess item, quantity, and price columns.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={parseAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="source" value={source} />
            <div className="flex-1 space-y-2">
              <Label htmlFor="pullsheet">Pullsheet</Label>
              <Input id="pullsheet" name="pullsheet" type="file" accept={source === 'warehouse_photo' ? 'image/*' : '.xlsx,.xls,.csv,image/*'} />
            </div>
            <Button type="submit" disabled={parsing}>{parsing ? 'Parsing…' : 'Parse upload'}</Button>
          </form>
          {parseState.message ? <p className="mt-3 text-sm text-destructive">{parseState.message}</p> : null}
        </CardContent>
      </Card>
      <PullsheetEditor parsed={parseState.parsed} />
    </div>
  )
}
