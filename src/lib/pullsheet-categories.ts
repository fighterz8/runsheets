export const PULLSHEET_CATEGORIES = [
  'Alcohol',
  'Dry Goods/Wares',
  'Bar Installations',
  'Bar Essentials',
  'Kitchen + Miscellaneous',
  'SOC Cocktail Mixers',
  'Garnishes',
  'Modifiers/Perishables',
  'Decor',
  'POS & Tech Equipment',
  'Named Sections',
  'Glassware',
] as const

export const ALCOHOL_SUBCATEGORIES = [
  'Spirits',
  'Wine',
  'Beer',
  'Champagne/Sparkling',
  'Sake/Other',
] as const

export const WAREHOUSE_ALCOHOL_SUBCATEGORIES = [
  'Spirits',
  'Wine',
  'Champagne/Sparkling',
  'Sake/Other',
] as const

export const GLASSWARE_RACKS = {
  Rocks: 25,
  Highball: 36,
  Wine: 25,
  Coupe: 25,
  Flute: 36,
} as const

export type PullsheetCategory = (typeof PULLSHEET_CATEGORIES)[number]
export type AlcoholSubcategory = (typeof ALCOHOL_SUBCATEGORIES)[number]
export type ShrinkageResolution = 'Broken' | 'Missing' | 'Accounted For'

export const COUNTABLE_CATEGORIES = ['Alcohol', 'SOC Cocktail Mixers', 'Glassware', 'Named Sections'] as const

export function isCountableCategory(category: string | null | undefined, alcoholSubcategory?: string | null) {
  return (category === 'Alcohol' && alcoholSubcategory !== 'Beer') || category === 'SOC Cocktail Mixers' || category === 'Glassware' || category === 'Named Sections'
}

export function normalizeCategory(value: unknown): PullsheetCategory {
  const category = String(value ?? '').trim()
  return PULLSHEET_CATEGORIES.find((candidate) => candidate.toLowerCase() === category.toLowerCase()) ?? 'Kitchen + Miscellaneous'
}

export function normalizeAlcoholSubcategory(value: unknown): AlcoholSubcategory | '' {
  const subcategory = String(value ?? '').trim()
  return ALCOHOL_SUBCATEGORIES.find((candidate) => candidate.toLowerCase() === subcategory.toLowerCase()) ?? ''
}
