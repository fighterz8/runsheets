import * as XLSX from 'xlsx'
import OpenAI from 'openai'
import { normalizeAlcoholSubcategory, normalizeCategory, type AlcoholSubcategory, type PullsheetCategory } from '@/lib/pullsheet-categories'

export type ParsedPullsheetItem = {
  name: string
  expectedQty: number
  unitPrice: number
  category: PullsheetCategory
  alcoholSubcategory?: AlcoholSubcategory | ''
  sectionLabel: string
}

export type ParsedPullsheet = {
  eventName: string
  eventDate: string
  items: ParsedPullsheetItem[]
  note: string
  source: 'empty' | 'excel' | 'csv' | 'vision'
}

function normalize(value: unknown) {
  return String(value ?? '').trim()
}

function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number.parseFloat(String(value ?? '').replace(/[$,]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function findColumn(headers: string[], candidates: string[]) {
  const lower = headers.map((header) => header.toLowerCase())
  return lower.findIndex((header) => candidates.some((candidate) => header.includes(candidate)))
}

function filenameGuess(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
  const dateMatch = base.match(/(20\d{2})[ -]?(\d{1,2})[ -]?(\d{1,2})|(?:(\d{1,2})[ -](\d{1,2})[ -](20\d{2}))/)
  let eventDate = ''

  if (dateMatch?.[1]) {
    eventDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`
  } else if (dateMatch?.[6]) {
    eventDate = `${dateMatch[6]}-${dateMatch[4].padStart(2, '0')}-${dateMatch[5].padStart(2, '0')}`
  }

  return { eventName: base || 'Untitled event', eventDate }
}

function parseVisionJson(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Vision returned text instead of JSON. Try scanning again with the page flatter and better lit.')
  }

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as { eventName?: string; eventDate?: string; items?: ParsedPullsheetItem[] }
  } catch (error) {
    console.error('Vision JSON parse failed', {
      error: error instanceof Error ? error.message : String(error),
      length: cleaned.length,
      preview: cleaned.slice(0, 500),
      tail: cleaned.slice(-500),
    })
    throw new Error('Vision read the image but returned incomplete JSON. I tightened the parser; please scan again. If it repeats, use a closer/cropped photo of one page.')
  }
}

export async function parseSpreadsheetPullsheet(file: File): Promise<ParsedPullsheet> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  const headers = rows[0] ? Object.keys(rows[0]) : []

  const nameIndex = findColumn(headers, ['item', 'name', 'product', 'description', 'liquor', 'bottle'])
  const qtyIndex = findColumn(headers, ['qty', 'quantity', 'count', 'expected', 'pull'])
  const priceIndex = findColumn(headers, ['price', 'cost', 'unit'])
  const categoryIndex = findColumn(headers, ['category'])
  const subcategoryIndex = findColumn(headers, ['alcohol', 'subcategory', 'type'])
  const sectionIndex = findColumn(headers, ['section', 'header', 'area'])
  const nameKey = headers[nameIndex] ?? headers[0]
  const qtyKey = headers[qtyIndex] ?? headers[1]
  const priceKey = headers[priceIndex] ?? headers[2]
  const categoryKey = headers[categoryIndex]
  const subcategoryKey = headers[subcategoryIndex]
  const sectionKey = headers[sectionIndex]

  const items = rows
    .map((row) => ({
      name: normalize(row[nameKey]),
      expectedQty: Math.max(0, Math.round(toNumber(row[qtyKey]))),
      unitPrice: Math.max(0, toNumber(row[priceKey])),
      category: normalizeCategory(categoryKey ? row[categoryKey] : undefined),
      alcoholSubcategory: normalizeAlcoholSubcategory(subcategoryKey ? row[subcategoryKey] : undefined),
      sectionLabel: normalize(sectionKey ? row[sectionKey] : undefined) || normalizeCategory(categoryKey ? row[categoryKey] : undefined),
    }))
    .filter((item) => item.name && !['total', 'subtotal'].includes(item.name.toLowerCase()))

  const guess = filenameGuess(file.name)

  return {
    ...guess,
    items: items.length ? items : [{ name: '', expectedQty: 0, unitPrice: 0, category: 'Kitchen + Miscellaneous', alcoholSubcategory: '', sectionLabel: 'Kitchen + Miscellaneous' }],
    note: `Parsed ${items.length} line item${items.length === 1 ? '' : 's'} from ${file.name}. Review before saving.`,
    source: file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel',
  }
}

export async function parseVisionPullsheet(file: File): Promise<ParsedPullsheet> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI Vision is not configured. Add OPENAI_API_KEY before photographing pullsheets.')
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 75_000, maxRetries: 0 })
  const model = process.env.OPENAI_VISION_MODEL ?? 'gpt-4o-mini'
  const startedAt = Date.now()
  const bytes = Buffer.from(await file.arrayBuffer())
  const dataUrl = `data:${file.type || 'image/jpeg'};base64,${bytes.toString('base64')}`

  const response = await client.responses.create({
    model,
    max_output_tokens: 6000,
    text: {
      format: {
        type: 'json_schema',
        name: 'pullsheet_parse',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            eventName: { type: 'string' },
            eventDate: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  name: { type: 'string' },
                  expectedQty: { type: 'number' },
                  unitPrice: { type: 'number' },
                  category: { type: 'string' },
                  alcoholSubcategory: { type: 'string' },
                  sectionLabel: { type: 'string' },
                },
                required: ['name', 'expectedQty', 'unitPrice', 'category', 'alcoholSubcategory', 'sectionLabel'],
              },
            },
          },
          required: ['eventName', 'eventDate', 'items'],
        },
      },
    },
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: [
              'Extract this catering/warehouse pullsheet from the entire uploaded image, not a cropped or sample area.',
              'Read every visible row/section/table on the page before answering.',
              'Return strict JSON only with keys: eventName string, eventDate YYYY-MM-DD or empty string, items array of {name string, expectedQty number, unitPrice number, category string, alcoholSubcategory string, sectionLabel string}.',
              'Use exactly these categories: Alcohol, Dry Goods/Wares, Bar Installations, Bar Essentials, Kitchen + Miscellaneous, SOC Cocktail Mixers, Garnishes, Modifiers/Perishables, Decor, POS & Tech Equipment, Named Sections, Glassware.',
              'Alcohol must be subcategorized as exactly one of: Spirits, Wine, Beer, Champagne/Sparkling, Sake/Other. Infer from item name, for example Daou Cabernet is Wine and Don Julio is Spirits. Beer/seltzer should still be stored as Beer but is excluded from warehouse counting.',
              'SOC Cocktail Mixers is a named Snake Oil category. Classic Marg, Eye of the Tiger, and similar house cocktail mixes always go in SOC Cocktail Mixers, not Kitchen + Miscellaneous. Glassware goes in Glassware and is counted in racks, not individual glasses: Rocks 25/rack, Highball 36/rack, Wine 25/rack, Coupe 25/rack, Flute 36/rack.',
              'Named Sections are header-driven. If a pullsheet section header does not map to the fixed categories, set category to Named Sections and sectionLabel to the exact pullsheet header, e.g. Artist Bar, VIP Lounge, Green Room. Never hardcode Named Section labels.',
              'Keep the same item as separate rows/tiles when it appears under different physical pullsheet headers. Deduplicate only within the same sectionLabel.',
              'Double-check OCR quantities explicitly, especially digit counts and units: distinguish 20 gallon from 2 gallon.',
              'If an item does not clearly fit a category, use Kitchen + Miscellaneous. Do not use Other or any catch-all category.',
              'Use the item names exactly as printed when possible. Put the quantity/count/pulled amount in expectedQty. Use unitPrice 0 if no price is visible.',
              'Do not invent example rows such as Tequila, Chardonnay, or IPA Beer unless those exact items are visible in the uploaded image.',
            ].join(' '),
          },
          { type: 'input_image', image_url: dataUrl, detail: 'auto' },
        ],
      },
    ],
  })

  const parsed = parseVisionJson(response.output_text)

  if (!parsed.items?.length) {
    throw new Error('Vision could not find pullsheet line items in that image. Try a sharper, well-lit photo.')
  }

  return {
    eventName: normalize(parsed.eventName) || filenameGuess(file.name).eventName,
    eventDate: normalize(parsed.eventDate),
    items: (parsed.items ?? []).map((item) => ({
      name: normalize(item.name),
      expectedQty: Math.max(0, Math.round(toNumber(item.expectedQty))),
      unitPrice: Math.max(0, toNumber(item.unitPrice)),
      category: normalizeCategory(item.category),
      alcoholSubcategory: normalizeCategory(item.category) === 'Alcohol' ? normalizeAlcoholSubcategory(item.alcoholSubcategory) : '',
      sectionLabel: normalize(item.sectionLabel) || normalizeCategory(item.category),
    })).filter((item) => item.name),
    note: `Vision parsed ${parsed.items.length} line item${parsed.items.length === 1 ? '' : 's'} from ${file.name} using ${model} in ${Math.round((Date.now() - startedAt) / 1000)}s. Review before saving.`,
    source: 'vision',
  }
}

export function emptyPullsheet(): ParsedPullsheet {
  return {
    eventName: '',
    eventDate: '',
    items: [{ name: '', expectedQty: 0, unitPrice: 0, category: 'Kitchen + Miscellaneous', alcoholSubcategory: '', sectionLabel: 'Kitchen + Miscellaneous' }],
    note: 'No warehouse photo parsed yet.',
    source: 'empty',
  }
}
