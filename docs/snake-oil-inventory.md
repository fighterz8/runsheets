# Snake Oil Inventory Parser Source of Truth

This document defines what the Runsheets parser and warehouse count experience should treat as countable inventory for Snake Oil.

## Warehouse-counted categories

Warehouse sessions only receive and count these categories at the data layer:

1. Alcohol
2. SOC Cocktail Mixers
3. Glassware
4. Named Sections, only when the section represents countable alcohol, SOC cocktail mixers, or glassware

Beer/seltzer, disposables, dry goods, wares, decor, POS/tech, perishables, garnishes, and other non-counted categories may be parsed and stored for ops/admin visibility, but must not be returned to warehouse sessions.

## Alcohol

Alcohol is counted by unit/bottle unless the pullsheet clearly says otherwise.

Subcategories used for filtering:
- Spirits
- Wine
- Champagne/Sparkling
- Sake/Other

Beer and seltzer are intentionally excluded from warehouse count sessions.

## SOC Cocktail Mixers

Snake Oil house cocktail mixers are countable and visible to warehouse sessions.

Examples:
- Classic Marg
- Eye of the Tiger
- Other SOC/house cocktail batch mixers

## Glassware

Glassware is counted in racks, not individual glasses.

Canonical rack sizes:
- Rocks: 25 glasses per rack
- Highball: 36 glasses per rack
- Wine: 25 glasses per rack
- Coupe: 25 glasses per rack
- Flute: 36 glasses per rack

Parser rule: convert expected glassware counts to expected racks only when the source clearly provides rack counts or a glass type + rack context. Preserve item names and section labels for review.

## Shrinkage resolution

Each count can be marked with one shrinkage resolution:
- Broken
- Missing
- Accounted For

Meaning:
- Accounted For: count is short but explained/acceptable.
- Broken: count is short due to breakage.
- Missing: count is short and unresolved.

## Warehouse tile states

- White: not started
- Green: confirmed and count matches expected
- Yellow: confirmed short and marked Accounted For
- Gray: confirmed and marked Broken
- Muted red: confirmed short and Missing/unresolved
