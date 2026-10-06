export interface ResolvedToken {
  /** e.g. "brand.primary" */
  path: string
  /** raw value from design-guideline.json, e.g. "{palette.brand.600}" or "" */
  raw: string
  /** e.g. "palette.brand.600", null if raw isn't a reference */
  refPath: string | null
  /** resolved hex, null if unresolved */
  hex: string | null
  /** CSS custom property name /sync-tokens would write this token to, e.g. "brand-primary" */
  cssVarKey: string
}

const REFERENCE_PATTERN = /^\{(palette\..+)\}$/

export function resolveReference(
  raw: string,
  palette: Record<string, unknown>
): { refPath: string | null; hex: string | null } {
  const match = typeof raw === 'string' ? raw.match(REFERENCE_PATTERN) : null
  if (!match) return { refPath: null, hex: null }

  const refPath = match[1]
  const segments = refPath.split('.').slice(1) // drop leading "palette"

  let node: unknown = palette
  for (const segment of segments) {
    if (node == null || typeof node !== 'object') {
      node = null
      break
    }
    node = (node as Record<string, unknown>)[segment]
  }

  return { refPath, hex: typeof node === 'string' ? node : null }
}

export function resolveSemanticGroup(
  semantic: Record<string, Record<string, string>>,
  palette: Record<string, unknown>
): Record<string, ResolvedToken[]> {
  const groups: Record<string, ResolvedToken[]> = {}

  for (const [category, tokens] of Object.entries(semantic)) {
    groups[category] = Object.entries(tokens).map(([token, raw]) => {
      const { refPath, hex } = resolveReference(raw, palette)
      return { path: `${category}.${token}`, raw, refPath, hex, cssVarKey: `${category}-${token}` }
    })
  }

  return groups
}
