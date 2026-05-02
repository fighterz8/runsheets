'use client'

import { useMemo, useState, useActionState } from 'react'
import { submitCountAction } from '@/app/(dashboard)/events/[id]/count/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type CountTileProps = {
  eventId: string
  item: {
    id: string
    name: string
    expected_qty: number
    is_sealed_case: boolean
    audit_flagged: boolean
  }
  count?: {
    counted_qty: number
    audit_photo_url: string | null
  }
}

const initialState: { message?: string } = {}

export function CountTile({ eventId, item, count }: CountTileProps) {
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState(count?.counted_qty ?? 0)
  const [state, formAction, pending] = useActionState(submitCountAction, initialState)
  const status = useMemo(() => {
    if (!count) return 'pending'
    return count.counted_qty === item.expected_qty ? 'matched' : 'discrepancy'
  }, [count, item.expected_qty])
  const statusClasses = {
    pending: 'border-muted bg-muted/30',
    matched: 'border-emerald-500 bg-emerald-50 text-emerald-950',
    discrepancy: 'border-red-500 bg-red-50 text-red-950',
  }[status]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={`rounded-2xl border p-5 text-left shadow-sm transition hover:shadow-md ${statusClasses}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{item.name}</h2>
            <p className="mt-2 text-sm opacity-75">Expected: {item.expected_qty}</p>
          </div>
          <Badge variant={status === 'pending' ? 'secondary' : status === 'matched' ? 'default' : 'destructive'}>
            {status === 'pending' ? 'gray' : status === 'matched' ? 'green' : 'red'}
          </Badge>
        </div>
        {count ? <p className="mt-4 text-sm">Counted: {count.counted_qty}</p> : <p className="mt-4 text-sm">Tap to count</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {item.is_sealed_case ? <Badge variant="outline">sealed case</Badge> : null}
          {item.audit_flagged ? <Badge variant="outline">audit photo required</Badge> : null}
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>Expected quantity: {item.expected_qty}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="event_id" value={eventId} />
          <input type="hidden" name="item_id" value={item.id} />
          <input type="hidden" name="audit_flagged" value={String(item.audit_flagged)} />
          <div className="space-y-2">
            <Label htmlFor={`count-${item.id}`}>Counted quantity</Label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setQuantity((value) => Math.max(0, value - 1))}>-1</Button>
              <Input id={`count-${item.id}`} name="counted_qty" type="number" min="0" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
              <Button type="button" variant="outline" onClick={() => setQuantity((value) => value + 1)}>+1</Button>
            </div>
          </div>
          {item.is_sealed_case ? (
            <Button type="button" variant="outline" onClick={() => setQuantity(item.expected_qty)}>
              Sealed case shortcut: matches expected
            </Button>
          ) : null}
          {item.audit_flagged ? (
            <div className="space-y-2">
              <Label htmlFor={`photo-${item.id}`}>Audit photo required</Label>
              <Input id={`photo-${item.id}`} name="audit_photo" type="file" accept="image/*" capture="environment" required={!count?.audit_photo_url} />
            </div>
          ) : null}
          {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
          <Button type="submit" disabled={pending} onClick={() => !item.audit_flagged && setOpen(false)}>
            {pending ? 'Confirming…' : 'Confirm count'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
