'use server'

import { revalidatePath } from 'next/cache'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

type CountState = {
  message?: string
}

function toInt(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

export async function submitCountAction(_state: CountState, formData: FormData): Promise<CountState> {
  const profile = await requireProfile()

  if (profile.role !== 'warehouse') {
    return { message: 'Only warehouse users can submit counts.' }
  }

  const eventId = String(formData.get('event_id') ?? '')
  const itemId = String(formData.get('item_id') ?? '')
  const countedQty = toInt(formData.get('counted_qty'))
  const auditFlagged = String(formData.get('audit_flagged') ?? '') === 'true'
  const photo = formData.get('audit_photo')
  const supabase = await createClient()
  let auditPhotoUrl: string | null = null

  if (!eventId || !itemId) {
    return { message: 'Missing event or item.' }
  }

  if (auditFlagged) {
    if (!(photo instanceof File) || photo.size === 0) {
      return { message: 'Audit-flagged items require a photo before accepting the count.' }
    }

    const extension = photo.name.split('.').pop() || 'jpg'
    const path = `${eventId}/${itemId}-${Date.now()}.${extension}`
    const { error: uploadError } = await supabase.storage
      .from('audit-photos')
      .upload(path, photo, { upsert: false, contentType: photo.type || 'image/jpeg' })

    if (uploadError) {
      return { message: uploadError.message }
    }

    auditPhotoUrl = path
  }

  const { data: existing } = await supabase
    .from('count_records')
    .select('id')
    .eq('pullsheet_item_id', itemId)
    .eq('counted_by', profile.id)
    .maybeSingle()

  const payload = {
    pullsheet_item_id: itemId,
    counted_qty: countedQty,
    counted_by: profile.id,
    audit_photo_url: auditPhotoUrl,
  }

  const { error } = existing?.id
    ? await supabase.from('count_records').update(payload).eq('id', existing.id)
    : await supabase.from('count_records').insert(payload)

  if (error) {
    return { message: error.message }
  }

  revalidatePath(`/events/${eventId}/count`)
  revalidatePath(`/events/${eventId}`)
  return {}
}
