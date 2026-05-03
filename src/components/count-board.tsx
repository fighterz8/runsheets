import type { PullsheetItemRow } from '@/lib/supabase/types'
import { CountTile } from '@/components/count-tile'
import { isCountableCategory } from '@/lib/pullsheet-categories'

export type CountRecordLite = {
  id: string
  pullsheet_item_id: string
  counted_qty: number
  audit_photo_url: string | null
  shrinkage_resolution: 'Broken' | 'Missing' | 'Accounted For' | null
}

const baseFilters = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'spirits', label: 'Spirits', test: (item: PullsheetItemRow) => item.alcohol_subcategory === 'Spirits' },
  { id: 'wine', label: 'Wine', test: (item: PullsheetItemRow) => item.alcohol_subcategory === 'Wine' },
  { id: 'champagne', label: 'Champagne', test: (item: PullsheetItemRow) => item.alcohol_subcategory === 'Champagne/Sparkling' },
  { id: 'soc-mixers', label: 'SOC Mixers', test: (item: PullsheetItemRow) => item.category === 'SOC Cocktail Mixers' },
  { id: 'glassware', label: 'Glassware', test: (item: PullsheetItemRow) => item.category === 'Glassware' },
] as const

function idForSection(section: string) {
  return section.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section'
}

export function CountBoard({ eventId, items, countByItem }: { eventId: string; items: PullsheetItemRow[]; countByItem: Map<string, CountRecordLite> }) {
  const countableItems = items.filter((item) => isCountableCategory(item.category, item.alcohol_subcategory))
  const namedSections = Array.from(new Set(countableItems.filter((item) => item.category === 'Named Sections').map((item) => item.section_label))).filter(Boolean)
  const groups = [
    ...baseFilters.map((filter) => ({ id: filter.id, label: filter.label, items: countableItems.filter(filter.test) })),
    ...namedSections.map((section) => ({ id: `section-${idForSection(section)}`, label: section, items: countableItems.filter((item) => item.category === 'Named Sections' && item.section_label === section) })),
  ].filter((group) => group.items.length > 0)

  if (countableItems.length === 0) {
    return <p className="rounded-3xl border p-6 text-muted-foreground">No countable items. Count view currently includes Alcohol, SOC Cocktail Mixers, Glassware, and Named Sections only.</p>
  }

  return (
    <div className="space-y-8">
      <nav className="sticky top-3 z-10 -mx-2 flex gap-2 overflow-x-auto rounded-3xl border bg-background/90 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70">
        {groups.map((group) => (
          <a
            key={group.id}
            href={`#${group.id}`}
            className="min-h-12 shrink-0 rounded-2xl px-5 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {group.label} <span className="text-muted-foreground/70">{group.items.length}</span>
          </a>
        ))}
      </nav>

      {groups.map((group) => (
        <section key={group.id} id={group.id} className="scroll-mt-24 space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{group.label}</h2>
              <p className="text-sm text-muted-foreground">{group.items.length} item{group.items.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {group.items.map((item) => (
              <CountTile key={item.id} eventId={eventId} item={item} count={countByItem.get(item.id)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
