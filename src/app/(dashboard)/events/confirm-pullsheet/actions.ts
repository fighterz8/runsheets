'use server'

import { parseSpreadsheetPullsheet, parseVisionPullsheet, emptyPullsheet, type ParsedPullsheet } from '@/lib/pullsheet-parser'

export type ParseState = {
  parsed: ParsedPullsheet
  message?: string
}

export const initialParseState: ParseState = {
  parsed: emptyPullsheet(),
}

export async function parsePullsheetAction(_state: ParseState, formData: FormData): Promise<ParseState> {
  const file = formData.get('pullsheet')
  const source = String(formData.get('source') ?? 'ops_upload')

  if (!(file instanceof File) || file.size === 0) {
    return { parsed: emptyPullsheet(), message: 'Choose a pullsheet file or continue manually.' }
  }

  const name = file.name.toLowerCase()
  const isSpreadsheet = name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|heic)$/i.test(name)

  try {
    if (isSpreadsheet) {
      return { parsed: await parseSpreadsheetPullsheet(file) }
    }

    if (isImage || source === 'warehouse_photo') {
      return { parsed: await parseVisionPullsheet(file) }
    }

    return { parsed: emptyPullsheet(), message: 'Unsupported file type. Upload .xlsx, .csv, or an image.' }
  } catch (error) {
    return {
      parsed: emptyPullsheet(),
      message: error instanceof Error ? error.message : 'Could not parse pullsheet.',
    }
  }
}
