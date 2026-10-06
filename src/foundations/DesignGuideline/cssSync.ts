export interface CssColorVars {
  light: Record<string, string>
  dark: Record<string, string>
}

export type SyncStatus = 'synced' | 'stale' | 'not-synced'

const DARK_MEDIA_MARKER = '@media (prefers-color-scheme: dark)'
const COLOR_VAR_PATTERN = /--color-([\w-]+):\s*([^;]+);/g

/**
 * globals.css only has the *resolved* hex values (the {palette.x.y} reference
 * is gone after /sync-tokens runs), so this only answers "does it match the
 * current design-guideline.json" — the reference chain itself still has to
 * come from resolveToken.ts reading the JSON directly.
 */
export function extractCssColorVars(css: string): CssColorVars {
  const splitIndex = css.indexOf(DARK_MEDIA_MARKER)
  const lightSection = splitIndex === -1 ? css : css.slice(0, splitIndex)
  const darkSection = splitIndex === -1 ? '' : css.slice(splitIndex)

  return { light: parseColorVars(lightSection), dark: parseColorVars(darkSection) }
}

function parseColorVars(section: string): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const match of section.matchAll(COLOR_VAR_PATTERN)) {
    vars[match[1]] = match[2].trim()
  }
  return vars
}

/**
 * Spacing/border-radius don't have a light/dark split — /sync-tokens writes
 * them once into `@theme { }` regardless of color scheme. `prefix` is the
 * CSS custom property prefix (e.g. "spacing" or "radius", note the latter
 * drops "border-" — see /sync-tokens Step 4).
 */
export function extractCssScaleVars(css: string, prefix: string): Record<string, string> {
  const pattern = new RegExp(`--${prefix}-([\\w-]+):\\s*([^;]+);`, 'g')
  const vars: Record<string, string> = {}
  for (const match of css.matchAll(pattern)) {
    vars[match[1]] = match[2].trim()
  }
  return vars
}

/**
 * `expectedValue` must already be in the exact form /sync-tokens would write
 * to CSS — a hex string for colors, or a value with its unit suffix for
 * spacing/border-radius (e.g. "16px").
 */
export function getSyncStatus(
  cssVarKey: string,
  expectedValue: string | null,
  cssVars: Record<string, string>
): SyncStatus | null {
  if (!expectedValue) return null
  const cssValue = cssVars[cssVarKey]
  if (!cssValue) return 'not-synced'
  return cssValue.toLowerCase() === expectedValue.toLowerCase() ? 'synced' : 'stale'
}
