'use server'

import { parseSpreadsheetPullsheet, parseVisionPullsheet, emptyPullsheet, type ParsedPullsheet } from '@/lib/pullsheet-parser'

type ParseState = {
  parsed: ParsedPullsheet
  message?: string
}

function parseErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Could not parse pullsheet.'

  if (message.includes('429') || message.toLowerCase().includes('insufficient_quota') || message.toLowerCase().includes('exceeded your current quota')) {
    return 'OpenAI rejected the Vision request for quota/billing on the configured API key. Check the OPENAI_API_KEY project billing/quota in Vercel, then try again.'
  }

  return message
}

export async function parsePullsheetAction(_state: ParseState, formData: FormData): Promise<ParseState> {
  const file = formData.getAll('pullsheet').find((value): value is File => value instanceof File && value.size > 0)
  const source = String(formData.get('source') ?? 'ops_upload')

  if (!file) {
    return { parsed: emptyPullsheet(), message: 'Choose or take a pullsheet photo first.' }
  }

  const name = file.name.toLowerCase()
  const isSpreadsheet = name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|heic)$/i.test(name)

  try {
    if (source === 'warehouse_photo') {
      if (!isImage) {
        return { parsed: emptyPullsheet(), message: 'Warehouse pullsheets must be uploaded as an image.' }
      }
      return { parsed: await parseVisionPullsheet(file) }
    }

    if (isSpreadsheet) {
      return { parsed: await parseSpreadsheetPullsheet(file) }
    }

    return { parsed: emptyPullsheet(), message: 'Unsupported file type. Upload a pullsheet image.' }
  } catch (error) {
    return {
      parsed: emptyPullsheet(),
      message: parseErrorMessage(error),
    }
  }
}
