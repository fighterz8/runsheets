'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin, requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

type CreateEventState = {
  message?: string
}

function toInt(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toCents(value: FormDataEntryValue | null) {
  const amount = Number.parseFloat(String(value ?? '0'))
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0
}

export async function createEventAction(
  _state: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const profile = await requireAdmin()
  const supabase = await createClient()

  const name = String(formData.get('name') ?? '').trim()
  const eventDate = String(formData.get('event_date') ?? '').trim()

  if (!name || !eventDate) {
    return { message: 'Event name and date are required.' }
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      org_id: profile.org_id,
      name,
      event_date: eventDate,
      status: 'draft',
      created_by: profile.id,
      pullsheet_source: 'warehouse_photo',
    })
    .select('id')
    .single()

  if (eventError || !event) {
    return { message: eventError?.message ?? 'Could not create event.' }
  }

  revalidatePath('/events')
  redirect(`/events/${event.id}`)
}


export async function createWarehousePullsheetAction(
  _state: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const profile = await requireProfile()

  if (profile.role !== 'warehouse' && profile.role !== 'admin') {
    return { message: 'Viewer accounts cannot create or confirm pullsheets.' }
  }

  const supabase = await createClient()
  const eventId = String(formData.get('event_id') ?? '').trim()

  if (!eventId) {
    return { message: 'Choose the event this photographed pullsheet belongs to.' }
  }

  const itemNames = formData.getAll('item_name').map((value) => String(value).trim())
  const quantities = formData.getAll('expected_qty')
  const prices = formData.getAll('unit_price')
  const items = itemNames
    .map((itemName, index) => ({
      sku: null,
      name: itemName,
      expected_qty: toInt(quantities[index], 0),
      unit_price_cents: toCents(prices[index]),
      is_sealed_case: false,
      audit_flagged: false,
    }))
    .filter((item) => item.name.length > 0)

  if (items.length === 0) {
    return { message: 'Add at least one parsed or corrected line item.' }
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .update({
      pullsheet_source: 'warehouse_photo',
      pullsheet_confirmed_at: new Date().toISOString(),
      pullsheet_confirmed_by: profile.id,
    })
    .eq('id', eventId)
    .eq('org_id', profile.org_id)
    .is('pullsheet_confirmed_at', null)
    .select('id')
    .single()

  if (eventError || !event) {
    return { message: eventError?.message ?? 'Could not lock pullsheet for that event.' }
  }

  await supabase.from('pullsheet_items').delete().eq('event_id', event.id)

  const { error: itemsError } = await supabase
    .from('pullsheet_items')
    .insert(items.map((item) => ({ ...item, event_id: event.id })))

  if (itemsError) {
    return { message: itemsError.message }
  }

  revalidatePath('/events')
  redirect(`/events/${event.id}`)
}

export async function confirmPullsheetAction(formData: FormData) {
  const profile = await requireProfile()

  if (profile.role === 'viewer') {
    return
  }

  const supabase = await createClient()
  const eventId = String(formData.get('event_id') ?? '')

  if (!eventId) {
    return
  }

  await supabase
    .from('events')
    .update({
      pullsheet_confirmed_at: new Date().toISOString(),
      pullsheet_confirmed_by: profile.id,
    })
    .eq('id', eventId)
    .eq('org_id', profile.org_id)

  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
}

export async function activateEventAction(formData: FormData) {
  const profile = await requireAdmin()
  const supabase = await createClient()
  const eventId = String(formData.get('event_id') ?? '')

  if (!eventId) {
    return
  }

  await supabase
    .from('events')
    .update({ status: 'active' })
    .eq('id', eventId)
    .eq('org_id', profile.org_id)

  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
}
