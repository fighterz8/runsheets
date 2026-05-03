import { NextResponse } from 'next/server'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: '#111827' },
  header: { marginBottom: 20, borderBottom: '2 solid #111827', paddingBottom: 12 },
  logo: { fontSize: 22, fontWeight: 700, letterSpacing: 1 },
  title: { fontSize: 16, marginTop: 6 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginBottom: 8 },
  row: { flexDirection: 'row', borderBottom: '1 solid #e5e7eb', paddingVertical: 5 },
  head: { backgroundColor: '#f3f4f6', fontWeight: 700 },
  item: { width: '34%' },
  small: { width: '13%' },
  category: { width: '20%' },
  note: { color: '#6b7280' },
})

type ReportItem = {
  name: string
  expected_qty: number
  unit_price_cents: number
  category: string
  alcohol_subcategory: string | null
  section_label: string
  count_records: { counted_qty: number; shrinkage_resolution: string | null }[]
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function ReportDocument({ event, items }: { event: { name: string; event_date: string }; items: ReportItem[] }) {
  const rows = items.map((item) => {
    const count = item.count_records[0]
    const counted = count?.counted_qty ?? 0
    const short = Math.max(0, item.expected_qty - counted)
    const shrinkage = short * item.unit_price_cents
    return { item, counted, short, shrinkage, resolution: count?.shrinkage_resolution ?? (short > 0 ? 'Missing' : '') }
  })
  const shrinkageByCategory = Array.from(rows.reduce((map, row) => {
    map.set(row.item.category, (map.get(row.item.category) ?? 0) + row.shrinkage)
    return map
  }, new Map<string, number>()))
  const broken = rows.filter((row) => row.resolution === 'Broken')
  const missing = rows.filter((row) => row.short > 0 && row.resolution !== 'Broken' && row.resolution !== 'Accounted For')

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>SNAKE OIL</Text>
          <Text style={styles.title}>Inventory Reconciliation Report</Text>
          <Text style={styles.note}>{event.name} · {event.event_date}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected vs counted</Text>
          <View style={[styles.row, styles.head]}><Text style={styles.item}>Item</Text><Text style={styles.category}>Category</Text><Text style={styles.small}>Expected</Text><Text style={styles.small}>Counted</Text><Text style={styles.small}>Short</Text><Text style={styles.small}>Resolution</Text></View>
          {rows.map((row) => (
            <View key={`${row.item.name}-${row.item.section_label}`} style={styles.row}>
              <Text style={styles.item}>{row.item.name}</Text><Text style={styles.category}>{row.item.category}</Text><Text style={styles.small}>{row.item.expected_qty}</Text><Text style={styles.small}>{row.counted}</Text><Text style={styles.small}>{row.short}</Text><Text style={styles.small}>{row.resolution || '—'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shrinkage dollars by category</Text>
          {shrinkageByCategory.map(([category, cents]) => <Text key={category}>{category}: {money(cents)}</Text>)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Broken items</Text>
          {broken.length ? broken.map((row) => <Text key={row.item.name}>{row.item.name}: short {row.short} ({money(row.shrinkage)})</Text>) : <Text style={styles.note}>None</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Missing / unresolved items</Text>
          {missing.length ? missing.map((row) => <Text key={row.item.name}>{row.item.name}: short {row.short} ({money(row.shrinkage)})</Text>) : <Text style={styles.note}>None</Text>}
        </View>
      </Page>
    </Document>
  )
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile()

  if (profile.role === 'warehouse') {
    return NextResponse.json({ ok: false, message: 'Reports are admin/viewer only.' }, { status: 403 })
  }

  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select('id, name, event_date')
    .eq('id', id)
    .eq('org_id', profile.org_id)
    .single()

  if (!event) return NextResponse.json({ ok: false, message: 'Event not found.' }, { status: 404 })

  const { data: items } = await supabase
    .from('pullsheet_items')
    .select('name, expected_qty, unit_price_cents, category, alcohol_subcategory, section_label, count_records(counted_qty, shrinkage_resolution)')
    .eq('event_id', id)
    .order('category')

  const buffer = await renderToBuffer(<ReportDocument event={event} items={(items ?? []) as ReportItem[]} />)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${event.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-report.pdf"`,
    },
  })
}
