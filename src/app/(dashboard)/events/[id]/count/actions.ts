'use server'

import { revalidatePath } from 'next/cache'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { normalizeAlcoholSubcategory } from '@/lib/pullsheet-categories'

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

  const { data: remaining } = await supabase
    .from('pullsheet_items')
    .select('id, count_records(id)')
    .eq('event_id', eventId)
    .in('category', ['Alcohol', 'SOC Cocktail Mixers', 'Named Sections'])
    .neq('ops_review_status', 'rejected')

  const countableItems = remaining ?? []
  const complete = countableItems.length > 0 && countableItems.every((item) => Array.isArray(item.count_records) && item.count_records.length > 0)

  if (complete) {
    await supabase
      .from('events')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', eventId)
      .eq('org_id', profile.org_id)
      .eq('status', 'active')
  }

  revalidatePath(`/events/${eventId}/count`)
  revalidatePath(`/events/${eventId}`)
  return {}
}

export async function flagUnexpectedItemAction(_state: CountState, formData: FormData): Promise<CountState> {
  const profile = await requireProfile()

  if (profile.role !== 'warehouse') {
    return { message: 'Only warehouse users can flag unexpected items.' }
  }

  const eventId = String(formData.get('event_id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const countedQty = toInt(formData.get('counted_qty'))
  const alcoholSubcategory = normalizeAlcoholSubcategory(formData.get('alcohol_subcategory')) || 'Spirits'
  const supabase = await createClient()

  if (!eventId || !name) {
    return { message: 'Name the unexpected item.' }
  }

  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('org_id', profile.org_id)
    .eq('status', 'active')
    .single()

  if (!event) {
    return { message: 'Unexpected items can only be flagged on active events.' }
  }

  const { data: item, error: itemError } = await supabase
    .from('pullsheet_items')
    .insert({
      event_id: event.id,
      name,
      expected_qty: 0,
      unit_price_cents: 0,
      category: 'Alcohol',
      alcohol_subcategory: alcoholSubcategory,
      section_label: 'Unexpected Items',
      is_unexpected: true,
      ops_review_status: 'pending_review',
      audit_flagged: true,
    })
    .select('id')
    .single()

  if (itemError || !item) {
    return { message: itemError?.message ?? 'Could not flag unexpected item.' }
  }

  const { error: countError } = await supabase.from('count_records').insert({
    pullsheet_item_id: item.id,
    counted_qty: countedQty,
    counted_by: profile.id,
  })

  if (countError) {
    return { message: countError.message }
  }

  revalidatePath(`/events/${eventId}/count`)
  revalidatePath(`/events/${eventId}`)
  return {}
}
