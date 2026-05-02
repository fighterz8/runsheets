export type ParsedPullsheet = {
  eventName: string
  eventDate: string
  items: Array<{ name: string; expectedQty: number }>
  note: string
}

export async function parsePullsheetUpload(file: File | null): Promise<ParsedPullsheet> {
  if (!file || file.size === 0) {
    return {
      eventName: '',
      eventDate: '',
      items: [{ name: '', expectedQty: 0 }],
      note: 'No file uploaded. Enter the pullsheet manually.',
    }
  }

  // Placeholder parser boundary. Excel parsing via SheetJS and photo parsing via OpenAI Vision
  // will live here once the UI flow is approved and provider keys are configured.
  return {
    eventName: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
    eventDate: new Date().toISOString().slice(0, 10),
    items: [
      { name: 'Review parsed line item 1', expectedQty: 0 },
      { name: 'Review parsed line item 2', expectedQty: 0 },
    ],
    note: `Uploaded ${file.name}. Parser stub created review rows; replace with SheetJS/OpenAI Vision next.`,
  }
}
