import { addLineItemAction } from '@/app/(dashboard)/events/actions'
import { ALCOHOL_SUBCATEGORIES, PULLSHEET_CATEGORIES } from '@/lib/pullsheet-categories'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AddLineItemForm({ eventId }: { eventId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add last-minute line item</CardTitle>
        <CardDescription>Ops-only additions after upload. Warehouse only receives Alcohol, SOC Cocktail Mixers, and Named Sections.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={addLineItemAction} className="grid gap-3 md:grid-cols-[1fr_120px_180px_180px_1fr_auto]">
          <input type="hidden" name="event_id" value={eventId} />
          <div className="space-y-2">
            <Label>Item</Label>
            <Input name="name" required />
          </div>
          <div className="space-y-2">
            <Label>Expected</Label>
            <Input name="expected_qty" type="number" min="0" defaultValue="1" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <select name="category" className="min-h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs">
              {PULLSHEET_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Alcohol type</Label>
            <select name="alcohol_subcategory" className="min-h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs">
              <option value="">None</option>
              {ALCOHOL_SUBCATEGORIES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Section</Label>
            <Input name="section_label" placeholder="Optional" />
          </div>
          <div className="flex items-end">
            <Button type="submit">Add</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
