#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const [email, password, role = 'admin'] = process.argv.slice(2)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const orgId = process.env.RUNSHEETS_ORG_ID ?? '00000000-0000-0000-0000-000000000001'

if (!email || !password) {
  console.error('Usage: pnpm create-user <email> <password> [admin|warehouse|viewer]')
  process.exit(1)
}

if (!['admin', 'warehouse', 'viewer'].includes(role)) {
  console.error('Role must be admin, warehouse, or viewer')
  process.exit(1)
}

if (!url || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})

if (createError && !createError.message.toLowerCase().includes('already')) {
  console.error(createError.message)
  process.exit(1)
}

let userId = created.user?.id

if (!userId) {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error(listError.message)
    process.exit(1)
  }
  userId = users.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id
}

if (!userId) {
  console.error(`Could not find or create auth user for ${email}`)
  process.exit(1)
}

const { error: profileError } = await supabase.from('users').upsert({
  id: userId,
  org_id: orgId,
  email: email.toLowerCase(),
  role,
})

if (profileError) {
  console.error(profileError.message)
  process.exit(1)
}

console.log(`Ready: ${email.toLowerCase()} (${role}) in org ${orgId}`)
