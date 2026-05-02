import * as XLSX from 'xlsx'
import OpenAI from 'openai'

export type ParsedPullsheetItem = {
  name: string
  expectedQty: number
  unitPrice: number
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

export async function parseSpreadsheetPullsheet(file: File): Promise<ParsedPullsheet> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  const headers = rows[0] ? Object.keys(rows[0]) : []

  const nameIndex = findColumn(headers, ['item', 'name', 'product', 'description', 'liquor', 'bottle'])
  const qtyIndex = findColumn(headers, ['qty', 'quantity', 'count', 'expected', 'pull'])
  const priceIndex = findColumn(headers, ['price', 'cost', 'unit'])
  const nameKey = headers[nameIndex] ?? headers[0]
  const qtyKey = headers[qtyIndex] ?? headers[1]
  const priceKey = headers[priceIndex] ?? headers[2]

  const items = rows
    .map((row) => ({
      name: normalize(row[nameKey]),
      expectedQty: Math.max(0, Math.round(toNumber(row[qtyKey]))),
      unitPrice: Math.max(0, toNumber(row[priceKey])),
    }))
    .filter((item) => item.name && !['total', 'subtotal'].includes(item.name.toLowerCase()))

  const guess = filenameGuess(file.name)

  return {
    ...guess,
    items: items.length ? items : [{ name: '', expectedQty: 0, unitPrice: 0 }],
    note: `Parsed ${items.length} line item${items.length === 1 ? '' : 's'} from ${file.name}. Review before saving.`,
    source: file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel',
  }
}

export async function parseVisionPullsheet(file: File): Promise<ParsedPullsheet> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI Vision is not configured. Add OPENAI_API_KEY before photographing pullsheets.')
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const bytes = Buffer.from(await file.arrayBuffer())
  const dataUrl = `data:${file.type || 'image/jpeg'};base64,${bytes.toString('base64')}`

  const response = await client.responses.create({
    model: process.env.OPENAI_VISION_MODEL ?? 'gpt-4o-mini',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: [
              'Extract this catering/warehouse pullsheet from the entire uploaded image, not a cropped or sample area.',
              'Read every visible row/section/table on the page before answering.',
              'Return strict JSON only with keys: eventName string, eventDate YYYY-MM-DD or empty string, items array of {name string, expectedQty number, unitPrice number}.',
              'Use the item names exactly as printed when possible. Put the quantity/count/pulled amount in expectedQty. Use unitPrice 0 if no price is visible.',
              'Do not invent example rows such as Tequila, Chardonnay, or IPA Beer unless those exact items are visible in the uploaded image.',
            ].join(' '),
          },
          { type: 'input_image', image_url: dataUrl, detail: 'high' },
        ],
      },
    ],
  })

  const text = response.output_text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '')
  const parsed = JSON.parse(text) as { eventName?: string; eventDate?: string; items?: ParsedPullsheetItem[] }

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
    })).filter((item) => item.name),
    note: `Vision parsed ${parsed.items.length} line item${parsed.items.length === 1 ? '' : 's'} from ${file.name}. Review before saving.`,
    source: 'vision',
  }
}

export function emptyPullsheet(): ParsedPullsheet {
  return {
    eventName: '',
    eventDate: '',
    items: [{ name: '', expectedQty: 0, unitPrice: 0 }],
    note: 'No warehouse photo parsed yet.',
    source: 'empty',
  }
}
