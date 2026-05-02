export type UserRole = 'admin' | 'warehouse' | 'viewer'

export type UserProfile = {
  id: string
  org_id: string
  email: string
  role: UserRole
  created_at: string
}

export type EventStatus = 'draft' | 'active' | 'closed'

export type EventRow = {
  id: string
  org_id: string
  name: string
  event_date: string
  status: EventStatus
  created_by: string
  created_at: string
  closed_at: string | null
  pullsheet_source: 'manual' | 'ops_upload' | 'warehouse_photo'
  pullsheet_confirmed_at: string | null
  pullsheet_confirmed_by: string | null
}

export type PullsheetItemRow = {
  id: string
  event_id: string
  sku: string | null
  name: string
  expected_qty: number
  unit_price_cents: number
  is_sealed_case: boolean
  audit_flagged: boolean
  created_at: string
}
