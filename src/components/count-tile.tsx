'use client'

import { useMemo, useState, useActionState } from 'react'
import { submitCountAction } from '@/app/(dashboard)/events/[id]/count/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { productImageUrl } from '@/lib/product-images'

type CountTileProps = {
  eventId: string
  item: {
    id: string
    name: string
    expected_qty: number
    is_sealed_case: boolean
    audit_flagged: boolean
    category: string
    alcohol_subcategory: string | null
    section_label: string
    is_unexpected?: boolean
    ops_review_status?: string
    image_url?: string | null
  }
  count?: {
    counted_qty: number
    audit_photo_url: string | null
    shrinkage_resolution: 'Broken' | 'Missing' | 'Accounted For' | null
  }
}

const initialState: { message?: string } = {}

export function CountTile({ eventId, item, count }: CountTileProps) {
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState(count?.counted_qty ?? 0)
  const [state, formAction, pending] = useActionState(submitCountAction, initialState)
  const status = useMemo(() => {
    if (!count) return 'pending'
    const diff = Math.abs(count.counted_qty - item.expected_qty)
    if (diff === 0) return 'matched'
    if (count.shrinkage_resolution === 'Accounted For') return 'off'
    if (count.shrinkage_resolution === 'Broken') return 'broken'
    if (count.shrinkage_resolution === 'Missing') return 'missing'
    if (diff === 0) return 'matched'
    return item.expected_qty > 0 && diff / item.expected_qty > 0.1 ? 'missing' : 'off'
  }, [count, item.expected_qty])
  const statusClasses = {
    pending: 'border-slate-200 bg-white text-slate-950',
    matched: 'border-emerald-300 bg-emerald-100 text-emerald-950 shadow-emerald-100',
    off: 'border-amber-300 bg-amber-100 text-amber-950 shadow-amber-100',
    broken: 'border-slate-300 bg-slate-200 text-slate-950 shadow-slate-100',
    missing: 'border-red-300 bg-red-100/70 text-red-950 shadow-red-100',
  }[status]
  const namedSectionClass = item.category === 'Named Sections' ? 'ring-2 ring-violet-200 bg-violet-50/70' : ''

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={`min-h-[160px] aspect-square rounded-[2rem] border p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${statusClasses} ${namedSectionClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={productImageUrl(item.name, item.image_url)} alt="" className="mb-3 h-20 w-full rounded-3xl object-cover" />
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="line-clamp-2 text-lg font-semibold leading-tight tracking-tight">{item.name}</h2>
            <p className="mt-2 text-sm opacity-75">Exp: {item.expected_qty}</p>
            <p className="text-sm opacity-75">Count: {count?.counted_qty ?? '—'}</p>
          </div>
          <Badge variant={status === 'pending' ? 'secondary' : status === 'matched' ? 'default' : 'destructive'}>
            {status === 'pending' ? 'white' : status === 'matched' ? 'green' : status === 'off' ? 'yellow' : status === 'broken' ? 'gray' : 'red'}
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.is_unexpected ? <Badge variant="outline">ops review</Badge> : null}
          {item.is_sealed_case ? <Badge variant="outline">sealed case</Badge> : null}
          {item.audit_flagged ? <Badge variant="outline">audit photo required</Badge> : null}
        </div>
      </DialogTrigger>
      <DialogContent className="rounded-[2rem] p-6 sm:max-w-lg">
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
            <div className="flex gap-3">
              <Button type="button" size="lg" variant="outline" onClick={() => setQuantity((value) => Math.max(0, value - 1))}>-1</Button>
              <Input id={`count-${item.id}`} name="counted_qty" type="number" min="0" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="text-center text-lg font-semibold" />
              <Button type="button" size="lg" variant="outline" onClick={() => setQuantity((value) => value + 1)}>+1</Button>
            </div>
          </div>
          {item.is_sealed_case ? (
            <Button type="button" size="lg" variant="outline" className="w-full" onClick={() => setQuantity(item.expected_qty)}>
              Sealed case shortcut: matches expected
            </Button>
          ) : null}
          {item.audit_flagged ? (
            <div className="space-y-2">
              <Label htmlFor={`photo-${item.id}`}>Audit photo required</Label>
              <Input id={`photo-${item.id}`} name="audit_photo" type="file" accept="image/*" capture="environment" required={!count?.audit_photo_url} />
            </div>
          ) : null}
          <div className="space-y-2 rounded-2xl border p-3">
            <Label>Shrinkage resolution</Label>
            <select name="shrinkage_resolution" defaultValue={count?.shrinkage_resolution ?? ''} className="min-h-12 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs">
              <option value="">None / count matches</option>
              <option value="Accounted For">Accounted For</option>
              <option value="Broken">Broken</option>
              <option value="Missing">Missing</option>
            </select>
          </div>
          {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
          <Button type="submit" size="lg" className="min-h-14 w-full text-lg" disabled={pending} onClick={() => !item.audit_flagged && setOpen(false)}>
            {pending ? 'Confirming…' : 'Confirm count'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
