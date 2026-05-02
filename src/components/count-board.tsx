import type { PullsheetItemRow } from '@/lib/supabase/types'
import { CountTile } from '@/components/count-tile'

export type CountRecordLite = {
  id: string
  pullsheet_item_id: string
  counted_qty: number
  audit_photo_url: string | null
}

const categories = [
  { id: 'spirits', label: 'Spirits', tests: ['vodka', 'gin', 'rum', 'tequila', 'mezcal', 'whiskey', 'bourbon', 'scotch', 'rye', 'brandy', 'cognac', 'liqueur', 'amaro', 'aperol', 'campari'] },
  { id: 'wine', label: 'Wine', tests: ['wine', 'chardonnay', 'sauvignon', 'pinot', 'cabernet', 'merlot', 'rose', 'rosé', 'prosecco', 'champagne', 'sparkling'] },
  { id: 'beer', label: 'Beer', tests: ['beer', 'ipa', 'lager', 'pilsner', 'stout', 'ale', 'seltzer', 'cider'] },
] as const

function categoryFor(item: PullsheetItemRow) {
  const haystack = `${item.name} ${item.sku ?? ''}`.toLowerCase()
  return categories.find((category) => category.tests.some((test) => haystack.includes(test)))?.id ?? 'other'
}

export function CountBoard({ eventId, items, countByItem }: { eventId: string; items: PullsheetItemRow[]; countByItem: Map<string, CountRecordLite> }) {
  const groups = [
    ...categories.map((category) => ({ id: category.id, label: category.label, items: items.filter((item) => categoryFor(item) === category.id) })),
    { id: 'other', label: 'Other', items: items.filter((item) => categoryFor(item) === 'other') },
  ].filter((group) => group.items.length > 0)

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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item) => (
              <CountTile key={item.id} eventId={eventId} item={item} count={countByItem.get(item.id)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
