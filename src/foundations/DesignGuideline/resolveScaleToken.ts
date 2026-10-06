export interface ResolvedScaleToken {
  /** semantic role name, e.g. "card-padding" */
  path: string
  /** raw value from design-guideline.json, e.g. "{spacing.scale.md}" or "" */
  raw: string
  /** e.g. "spacing.scale.md", null if raw isn't a reference */
  refPath: string | null
  /** resolved unitless value matching the scale (e.g. "16"), null if unresolved */
  value: string | null
  /** CSS custom property name /sync-tokens would write this token to, e.g. "card-padding" */
  cssVarKey: string
}

const REFERENCE_PATTERN = /^\{([\w-]+(?:\.[\w-]+)*)\}$/

/**
 * Unlike palette references ({palette.brand.600}), spacing/border-radius
 * references carry their own domain in the path (e.g. "spacing.scale.md"),
 * so resolution walks the whole design-guideline.json root, not a sub-tree.
 */
export function resolveScaleReference(
  raw: string,
  root: Record<string, unknown>
): { refPath: string | null; value: string | null } {
  const match = typeof raw === 'string' ? raw.match(REFERENCE_PATTERN) : null
  if (!match) return { refPath: null, value: null }

  const refPath = match[1]
  const segments = refPath.split('.')

  let node: unknown = root
  for (const segment of segments) {
    if (node == null || typeof node !== 'object') {
      node = null
      break
    }
    node = (node as Record<string, unknown>)[segment]
  }

  return { refPath, value: typeof node === 'string' ? node : null }
}

export function resolveScaleSemantic(
  semantic: Record<string, string>,
  root: Record<string, unknown>
): ResolvedScaleToken[] {
  return Object.entries(semantic).map(([token, raw]) => {
    const { refPath, value } = resolveScaleReference(raw, root)
    return { path: token, raw, refPath, value, cssVarKey: token }
  })
}
