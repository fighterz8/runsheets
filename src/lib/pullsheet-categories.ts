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
] as const

export const ALCOHOL_SUBCATEGORIES = [
  'Spirits',
  'Wine',
  'Beer',
  'Champagne/Sparkling',
  'Sake/Other',
] as const

export type PullsheetCategory = (typeof PULLSHEET_CATEGORIES)[number]
export type AlcoholSubcategory = (typeof ALCOHOL_SUBCATEGORIES)[number]

export const COUNTABLE_CATEGORIES = ['Alcohol', 'SOC Cocktail Mixers', 'Named Sections'] as const

export function isCountableCategory(category: string | null | undefined) {
  return category === 'Alcohol' || category === 'SOC Cocktail Mixers' || category === 'Named Sections'
}

export function normalizeCategory(value: unknown): PullsheetCategory {
  const category = String(value ?? '').trim()
  return PULLSHEET_CATEGORIES.find((candidate) => candidate.toLowerCase() === category.toLowerCase()) ?? 'Kitchen + Miscellaneous'
}

export function normalizeAlcoholSubcategory(value: unknown): AlcoholSubcategory | '' {
  const subcategory = String(value ?? '').trim()
  return ALCOHOL_SUBCATEGORIES.find((candidate) => candidate.toLowerCase() === subcategory.toLowerCase()) ?? ''
}
