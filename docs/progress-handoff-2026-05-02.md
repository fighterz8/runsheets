# Runsheets Progress Handoff — 2026-05-02

## Current branch / PRs

- Repo: `/home/nick/.openclaw/workspace/repos/runsheets`
- PR #2: already merged into `main` (`feature/auth-and-event-creation`).
- PR #3: `feature/count-tile-ui`, still open. Do **not** merge until warehouse experience is accepted.
- PR #4: `feature/pr4-shrinkage-report`, open at https://github.com/fighterz8/runsheets/pull/4 and stacked on PR #3 (`base=feature/count-tile-ui`).

## Latest preview URLs

- PR #3 preview after warehouse MVP pass: `https://runsheets-ogjfh2hg3-fighterz8s-projects.vercel.app`
- PR #4 preview after shrinkage/report pass: `https://runsheets-h2zrtxuv7-fighterz8s-projects.vercel.app`

## Dev credentials

These are intentionally simple dev/test credentials only:

- Admin: `admin@runsheets.dev` / `password`
- Warehouse: `warehouse@runsheets.dev` / `password`
- Viewer: `mike@runsheets.dev` / `password`

Verified via Supabase auth on 2026-05-02 22:33 PDT.

## Important commits

### PR #3 branch: `feature/count-tile-ui`

- `0d47290` — Speed up mobile Vision scans
- `15acba2` — Overhaul pullsheet categories for count scope
- `2d92ce1` — Add warehouse cleanup controls and reduce Vision timeouts
- `5e64f89` — Force structured Vision JSON output
- `4875e8e` — Complete warehouse count MVP scope

### PR #4 branch: `feature/pr4-shrinkage-report`

- `4ac6335` — Document Snake Oil inventory rules
- `7653dc7` — Add shrinkage glassware and PDF report flow
- `7b30110` — Add PR4 progress screenshots
- `a077f0f` — Add PR4 screenshot contact sheet

## Source-of-truth doc

PR #4 intentionally committed this first:

- `docs/snake-oil-inventory.md`

It defines parser/counting rules for:

- Countable warehouse categories
- Alcohol subcategories
- SOC Cocktail Mixers
- Glassware rack sizes
- Shrinkage resolutions
- Warehouse tile states

## Screenshots

Saved and committed under:

- `docs/progress-screenshots/2026-05-02-pr4/`
- Contact sheet: `docs/progress-screenshots/2026-05-02-pr4/contact-sheet.png`

Captured pages:

1. Admin events list
2. Admin event detail / pullsheet
3. Admin new event
4. Admin upload pullsheet screen
5. Admin report page
6. Warehouse events mobile
7. Warehouse count mobile
8. Warehouse upload mobile

## Database migrations applied remotely

- `0006_add_pullsheet_categories.sql`
- `0007_warehouse_mvp.sql`
- `0008_pr4_shrinkage_glassware.sql`

## Current behavior implemented

### Vision/photo pullsheet parsing

- Browser resizes/compresses uploaded photos before sending to server.
- Upload screen shows thumbnail + filename/size before scanning.
- OpenAI Vision model configured through `OPENAI_VISION_MODEL`; currently set in Vercel envs.
- Vision output now uses structured JSON schema with larger output budget to avoid malformed/truncated JSON.
- Parser prompt reads whole image, includes explicit categories, SOC mixer rules, named section rules, glassware rules, and OCR quantity warnings.

### Categories / warehouse scope

Stored categories include:

- Alcohol
- Dry Goods/Wares
- Bar Installations
- Bar Essentials
- Kitchen + Miscellaneous
- SOC Cocktail Mixers
- Garnishes
- Modifiers/Perishables
- Decor
- POS & Tech Equipment
- Named Sections
- Glassware

Warehouse-visible server/RLS scope in PR #4:

- Alcohol except Beer
- SOC Cocktail Mixers
- Glassware
- Named Sections

Beer/seltzer and disposables/non-counted categories may be parsed and stored, but should not be sent to warehouse sessions.

### Warehouse count view

- POS-style square tiles, touch-friendly.
- Product-image fallback is deterministic generated SVG per item name.
- Quick filters: All, Spirits, Wine, Champagne, SOC Mixers, Glassware, dynamic named sections.
- Warehouse can flag unexpected items; creates expected-0 pending review tile.
- Confirming all warehouse-visible tiles closes the active event.

### Shrinkage

`count_records.shrinkage_resolution` added:

- Broken
- Missing
- Accounted For

Tile states:

- White: not started
- Green: confirmed and count matches expected
- Yellow: confirmed short and Accounted For
- Gray: confirmed and Broken
- Muted red: Missing/unresolved

### Ops/admin

- Ops/admin can add last-minute line items post-upload from event detail.
- Event detail has PDF report link for non-warehouse users.
- PDF endpoint is admin/viewer only; warehouse gets 403.

### PDF report

Endpoint/page:

- `/events/[id]/report`
- `/api/events/[id]/report`

Includes:

- Snake Oil header
- Expected vs counted
- Shrinkage dollars by category
- Broken items callout
- Missing/unresolved items callout

## Known caveats / likely next work

- Real product image fetching/cache is not implemented yet; only generated SVG fallback is implemented.
- PR #4 is stacked on PR #3, so GitHub diff depends on PR #3 not being merged yet.
- Need real user testing on phone for photo parsing and tile counting.
- Need verify PDF generation on preview with actual event data.
- Need decide whether Glassware should always be a first-class category or whether some Named Sections should be interpreted as glassware based on headers.
- Dev password is very simple by request; do not reuse for production.

## Useful commands

```bash
cd /home/nick/.openclaw/workspace/repos/runsheets
pnpm lint && pnpm build
gh pr view 3 --web
gh pr view 4 --web
```

To reset dev passwords if needed:

```bash
set -a; source .env.local; set +a
node - <<'NODE'
const { createClient } = require('@supabase/supabase-js');
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const password = 'password';
(async()=>{
 const {data,error}=await supabase.auth.admin.listUsers(); if(error) throw error;
 for (const email of ['admin@runsheets.dev','warehouse@runsheets.dev','mike@runsheets.dev']) {
  const user=data.users.find(u=>u.email===email);
  if(user) await supabase.auth.admin.updateUserById(user.id,{password,email_confirm:true});
 }
})()
NODE
```
