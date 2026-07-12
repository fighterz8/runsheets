'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createWarehousePullsheetAction } from '@/app/(dashboard)/events/actions'
import { parsePullsheetAction } from '@/app/(dashboard)/events/confirm-pullsheet/actions'
import type { ParsedPullsheet } from '@/lib/pullsheet-parser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ALCOHOL_SUBCATEGORIES, PULLSHEET_CATEGORIES } from '@/lib/pullsheet-categories'

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

const MAX_SCAN_IMAGE_DIMENSION = 1400
const SCAN_IMAGE_QUALITY = 0.72

type EventOption = {
  id: string
  name: string
  eventDate: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function resizeImageForVision(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  const image = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SCAN_IMAGE_DIMENSION / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return file

  context.drawImage(image, 0, 0, width, height)
  image.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', SCAN_IMAGE_QUALITY))
  if (!blob || blob.size >= file.size) return file

  const name = file.name.replace(/\.[^.]+$/, '') || 'pullsheet'
  return new File([blob], `${name}-scan.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
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
            <div key={index} className="grid gap-3 rounded-3xl border bg-background p-4 shadow-xs sm:grid-cols-[1fr_150px_150px_auto]">
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
              <div className="space-y-2 sm:col-span-2">
                <Label>Category</Label>
                <select name="category" defaultValue={item.category} className="min-h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                  {PULLSHEET_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Alcohol type</Label>
                <select name="alcohol_subcategory" defaultValue={item.alcoholSubcategory ?? ''} className="min-h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                  <option value="">None</option>
                  {ALCOHOL_SUBCATEGORIES.map((subcategory) => <option key={subcategory} value={subcategory}>{subcategory}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Section label</Label>
                <Input name="section_label" defaultValue={item.sectionLabel} placeholder="Exact pullsheet header" />
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
            <Button type="button" size="lg" variant="outline" onClick={() => setRows((current) => [...current, { name: '', expectedQty: 0, unitPrice: 0, category: 'Kitchen + Miscellaneous', alcoholSubcategory: '', sectionLabel: 'Kitchen + Miscellaneous' }])}>
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string>('')
  const [selectedFileDetails, setSelectedFileDetails] = useState<string>('')
  const [preparingImage, setPreparingImage] = useState(false)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleFileSelected(source: 'camera' | 'upload') {
    const activeInput = source === 'camera' ? cameraInputRef.current : uploadInputRef.current
    const inactiveInput = source === 'camera' ? uploadInputRef.current : cameraInputRef.current
    const file = activeInput?.files?.[0]

    if (inactiveInput) inactiveInput.value = ''
    if (!file || !activeInput) {
      setSelectedFileName('')
      setSelectedFileDetails('')
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
      return
    }

    setPreparingImage(true)
    const scanFile = await resizeImageForVision(file).catch(() => file)
    const transfer = new DataTransfer()
    transfer.items.add(scanFile)
    activeInput.files = transfer.files

    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(scanFile)
    })
    setSelectedFileName(scanFile.name)
    setSelectedFileDetails(`${formatBytes(scanFile.size)} scan image${scanFile.size < file.size ? `, compressed from ${formatBytes(file.size)}` : ''}`)
    setPreparingImage(false)
  }

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
            <Input ref={cameraInputRef} id="pullsheet-camera" name="pullsheet" type="file" accept="image/*" capture="environment" className="sr-only" onChange={() => handleFileSelected('camera')} />
            <Input ref={uploadInputRef} id="pullsheet-upload" name="pullsheet" type="file" accept="image/*" className="sr-only" onChange={() => handleFileSelected('upload')} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="button" size="lg" className="min-h-16 rounded-2xl text-base" onClick={() => cameraInputRef.current?.click()}>
                Take picture
              </Button>
              <Button type="button" size="lg" variant="outline" className="min-h-16 rounded-2xl text-base" onClick={() => uploadInputRef.current?.click()}>
                Upload photo for testing
              </Button>
            </div>
            {previewUrl ? (
              <div className="flex gap-4 rounded-3xl border bg-muted/40 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Selected pullsheet preview" className="h-28 w-28 rounded-2xl border bg-background object-cover" />
                <div className="min-w-0 py-2">
                  <p className="text-sm font-medium">Ready to scan</p>
                  <p className="truncate text-sm text-muted-foreground">{selectedFileName || 'Selected image'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedFileDetails || 'Preparing scan image…'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">This resized image is what will be sent to Vision.</p>
                </div>
              </div>
            ) : null}
            <p className="text-sm text-muted-foreground">After choosing a photo, tap Read with Vision. Keep this tab open until the review rows appear.</p>
            <Button type="submit" size="lg" className="w-full" disabled={parsing || preparingImage}>{preparingImage ? 'Preparing photo…' : parsing ? 'Reading photo…' : 'Read with Vision'}</Button>
          </form>
          {parseState.message ? <p className="mt-4 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">{parseState.message}</p> : null}
        </CardContent>
      </Card>
      {parsed.source !== 'empty' && parsed.items.length > 0 ? (
        <PullsheetEditor key={parsed.note} parsed={parsed} events={events} selectedEventId={selectedEventId} />
      ) : null}
    </div>
  )
}
