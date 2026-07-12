function hueForName(name: string) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 360
  return hash
}

export function productImageUrl(name: string, imageUrl?: string | null) {
  if (imageUrl) return imageUrl
  const hue = hueForName(name)
  const label = encodeURIComponent(name.split(/\s+/).slice(0, 3).join(' '))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="hsl(${hue},70%,34%)"/><stop offset="1" stop-color="hsl(${(hue + 45) % 360},75%,18%)"/></linearGradient></defs><rect width="400" height="260" rx="32" fill="url(#g)"/><circle cx="315" cy="62" r="52" fill="rgba(255,255,255,.16)"/><rect x="142" y="54" width="116" height="142" rx="26" fill="rgba(255,255,255,.88)"/><rect x="162" y="28" width="76" height="42" rx="14" fill="rgba(255,255,255,.72)"/><text x="200" y="226" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="700">${label}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
