import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import guideline from '../../../design-guideline.json'
import globalsCssRaw from '../../styles/globals.css?raw'
import { resolveSemanticGroup, type ResolvedToken } from './resolveToken'
import { resolveScaleSemantic, type ResolvedScaleToken } from './resolveScaleToken'
import { extractCssColorVars, extractCssScaleVars, getSyncStatus, type SyncStatus } from './cssSync'

interface ScaleGroup {
  scale: Record<string, string>
  semantic: Record<string, string>
}

interface Guideline {
  palette: Record<string, unknown>
  semantic: {
    light?: Record<string, Record<string, string>>
    dark?: Record<string, Record<string, string>>
  }
  typography: { fonts: { display: string; body: string }; imports: string[] }
  spacing: ScaleGroup
  'border-radius': ScaleGroup
}

// design-guideline.json ships with placeholder values until /setup-design-guideline fills it in,
// so its inferred literal type won't match the real shape — cast through unknown.
const data = guideline as unknown as Guideline
const dataRoot = data as unknown as Record<string, unknown>
const cssColorVars = extractCssColorVars(globalsCssRaw)
const cssSpacingVars = extractCssScaleVars(globalsCssRaw, 'spacing')
const cssRadiusVars = extractCssScaleVars(globalsCssRaw, 'radius')

const CHECKERBOARD_STYLE: CSSProperties = {
  backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)',
  backgroundSize: '10px 10px',
}

const TOOLTIP_WIDTH = 224 // matches w-56
const TOOLTIP_MARGIN = 8

// A viewport-anchored tooltip rendered into a portal so it can't be clipped by
// the swatch grid, the section's overflow, or the Storybook preview edges. It
// centers over the anchor, clamps horizontally inside the viewport, and flips
// below the anchor when there isn't room above.
function HoverTooltip({ anchor, title, body }: { anchor: DOMRect; title: string; body: string }) {
  const [height, setHeight] = useState(0)

  const rawLeft = anchor.left + anchor.width / 2 - TOOLTIP_WIDTH / 2
  const left = Math.max(
    TOOLTIP_MARGIN,
    Math.min(rawLeft, window.innerWidth - TOOLTIP_WIDTH - TOOLTIP_MARGIN)
  )
  const spaceAbove = anchor.top
  const showBelow = height > 0 && spaceAbove < height + TOOLTIP_MARGIN
  const top = showBelow ? anchor.bottom + TOOLTIP_MARGIN : anchor.top - TOOLTIP_MARGIN - height

  return createPortal(
    <div
      ref={(el) => {
        if (el && height === 0) setHeight(el.getBoundingClientRect().height)
      }}
      className="pointer-events-none fixed z-50 w-56 rounded-[8px] border border-gray-200 bg-white p-3 text-xs text-gray-700 shadow-lg"
      style={{ left, top }}
    >
      <p className="font-medium text-gray-900">{title}</p>
      <p className="mt-1 whitespace-pre-line font-mono text-[11px] text-gray-500">{body}</p>
    </div>,
    document.body
  )
}

function useGoogleFontImports(urls: string[]) {
  useEffect(() => {
    const added: HTMLLinkElement[] = []
    for (const url of urls) {
      if (!url || document.querySelector(`link[href="${url}"]`)) continue
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url
      document.head.appendChild(link)
      added.push(link)
    }
    return () => added.forEach((link) => link.remove())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.join('|')])
}

function TokenSwatch({
  token,
  dark = false,
  syncStatus,
}: {
  token: ResolvedToken
  dark?: boolean
  syncStatus?: SyncStatus | null
}) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null)

  let tooltip: string
  if (!token.raw) {
    tooltip = 'Not set'
  } else if (token.refPath && token.hex) {
    tooltip = `${token.raw}\n→ ${token.refPath}\n→ ${token.hex}`
  } else {
    tooltip = `Could not resolve reference: ${token.raw}`
  }

  if (syncStatus === 'not-synced') {
    tooltip += '\n\n⚠ Not synced to globals.css yet, run /sync-tokens'
  } else if (syncStatus === 'stale') {
    tooltip += '\n\n⚠ globals.css has a different value, it may be stale — run /sync-tokens again'
  }

  const showWarning = syncStatus === 'not-synced' || syncStatus === 'stale'

  return (
    <div
      className="relative flex flex-col items-center gap-1"
      onMouseEnter={(e) => setAnchor(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setAnchor(null)}
    >
      <div className="relative w-full">
        <div
          className="h-14 w-full rounded-[6px] border border-black/10"
          style={token.hex ? { backgroundColor: token.hex } : CHECKERBOARD_STYLE}
        />
        {showWarning && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold leading-none text-amber-950 ring-2 ring-white">
            !
          </span>
        )}
      </div>
      <span className={`text-xs ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
        {token.path.split('.').pop()}
      </span>
      {token.hex && (
        <span className={`font-mono text-[10px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
          {token.hex}
        </span>
      )}

      {anchor && <HoverTooltip anchor={anchor} title={token.path} body={tooltip} />}
    </div>
  )
}

function ScaleTokenPreview({
  token,
  syncStatus,
  render,
}: {
  token: ResolvedScaleToken
  syncStatus?: SyncStatus | null
  render: (px: number) => ReactNode
}) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const px = token.value ? Number(token.value) : null

  let tooltip: string
  if (!token.raw) {
    tooltip = 'Not set'
  } else if (token.refPath && token.value) {
    tooltip = `${token.raw}\n→ ${token.refPath}\n→ ${token.value}px`
  } else {
    tooltip = `Could not resolve reference: ${token.raw}`
  }

  if (syncStatus === 'not-synced') {
    tooltip += '\n\n⚠ Not synced to globals.css yet, run /sync-tokens'
  } else if (syncStatus === 'stale') {
    tooltip += '\n\n⚠ globals.css has a different value, it may be stale — run /sync-tokens again'
  }

  const showWarning = syncStatus === 'not-synced' || syncStatus === 'stale'

  return (
    <div
      className="relative flex flex-col items-center gap-1"
      onMouseEnter={(e) => setAnchor(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setAnchor(null)}
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        {px !== null ? render(px) : <div className="h-8 w-8 rounded" style={CHECKERBOARD_STYLE} />}
        {showWarning && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold leading-none text-amber-950 ring-2 ring-white">
            !
          </span>
        )}
      </div>
      <span className="text-xs text-gray-500">{token.path}</span>

      {anchor && <HoverTooltip anchor={anchor} title={token.path} body={tooltip} />}
    </div>
  )
}

function PaletteSection({ palette }: { palette: Record<string, unknown> }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900">Palette</h2>
      <p className="mb-4 text-sm text-gray-500">
        Raw color scale — every semantic token ultimately points to one of these steps.
      </p>
      <div className="space-y-4">
        {Object.entries(palette).map(([name, value]) => {
          if (typeof value === 'string') {
            return (
              <div key={name} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm font-medium text-gray-700">{name}</span>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="h-10 w-16 rounded-[6px] border border-black/10"
                    style={{ backgroundColor: value }}
                  />
                  <span className="text-[10px] text-gray-500">{value}</span>
                </div>
              </div>
            )
          }

          const steps = Object.entries(value as Record<string, string>)
          return (
            <div key={name} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-sm font-medium text-gray-700">{name}</span>
              <div className="grid flex-1 grid-cols-10 gap-2">
                {steps.map(([step, hex]) => (
                  <div key={step} className="flex flex-col items-center gap-1">
                    <div
                      className="h-10 w-full rounded-[6px] border border-black/10"
                      style={hex ? { backgroundColor: hex } : CHECKERBOARD_STYLE}
                    />
                    <span className="text-[10px] text-gray-500">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function SemanticSection({
  semantic,
  palette,
}: {
  semantic: Guideline['semantic']
  palette: Record<string, unknown>
}) {
  const hasDark = Boolean(semantic.dark)
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const active = mode === 'dark' ? semantic.dark : semantic.light
  const groups = active ? resolveSemanticGroup(active, palette) : {}
  const isDarkPreview = mode === 'dark'
  const activeCssVars = isDarkPreview ? cssColorVars.dark : cssColorVars.light

  const groupsWithStatus = Object.entries(groups).map(
    ([category, tokens]) =>
      [
        category,
        tokens.map((token) => ({
          token,
          syncStatus: getSyncStatus(token.cssVarKey, token.hex, activeCssVars),
        })),
      ] as const
  )
  const anyOutOfSync = groupsWithStatus.some(([, tokens]) =>
    tokens.some(({ syncStatus }) => syncStatus === 'stale' || syncStatus === 'not-synced')
  )

  return (
    <section>
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Semantic</h2>
        {hasDark && (
          <div className="flex rounded-full border border-gray-200 p-1 text-sm">
            <button
              type="button"
              className={`rounded-full px-3 py-1 transition-colors ${mode === 'light' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
              onClick={() => setMode('light')}
            >
              Light
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 transition-colors ${mode === 'dark' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
              onClick={() => setMode('dark')}
            >
              Dark
            </button>
          </div>
        )}
      </div>
      <p className="mb-1 text-sm text-gray-500">
        Semantic layer — grouped by role. Hover a swatch to see which palette step it points to.
      </p>
      {anyOutOfSync && (
        <p className="mb-4 text-sm text-amber-600">
          ⚠ Some tokens haven't been applied to globals.css yet — run <code>/sync-tokens</code> to pick up the latest values.
        </p>
      )}

      {!active ? (
        <p className="text-sm text-gray-400">
          This mode isn't set up (design-guideline.json has no semantic.{mode}).
        </p>
      ) : (
        <div className={`space-y-6 rounded-[12px] border p-6 ${isDarkPreview ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          {groupsWithStatus.map(([category, tokens]) => (
            <div key={category}>
              <h3 className={`mb-2 text-sm font-medium uppercase tracking-wide ${isDarkPreview ? 'text-gray-400' : 'text-gray-500'}`}>
                {category}
              </h3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3">
                {tokens.map(({ token, syncStatus }) => (
                  <TokenSwatch key={token.path} token={token} dark={isDarkPreview} syncStatus={syncStatus} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function TypographySection({ typography }: { typography: Guideline['typography'] }) {
  useGoogleFontImports(typography.imports ?? [])

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900">Typography</h2>
      <p className="mb-4 text-sm text-gray-500">
        Applies the font settings from design-guideline.json directly — no need to wait for /sync-tokens.
      </p>
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">
            display — {typography.fonts.display || 'not set'}
          </p>
          <p className="text-3xl text-gray-900" style={{ fontFamily: typography.fonts.display || undefined }}>
            The quick brown fox jumps over the lazy dog
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">
            body — {typography.fonts.body || 'not set'}
          </p>
          <p className="text-base text-gray-900" style={{ fontFamily: typography.fonts.body || undefined }}>
            The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      </div>
    </section>
  )
}

function SemanticScaleEmptyState({ example }: { example: string }) {
  return (
    <p className="text-sm text-gray-400">
      No semantic tokens defined yet. These roles usually only become clear once a real component
      needs one — add them as you go, e.g. in design-guideline.json:{' '}
      <code className="font-mono text-gray-500">{example}</code>.
    </p>
  )
}

function SpacingSection({
  spacing,
  cssVars,
}: {
  spacing: ScaleGroup
  cssVars: Record<string, string>
}) {
  const semanticTokens = resolveScaleSemantic(spacing.semantic, dataRoot)
  const anyOutOfSync = semanticTokens.some((token) => {
    const status = getSyncStatus(token.cssVarKey, token.value ? `${token.value}px` : null, cssVars)
    return status === 'stale' || status === 'not-synced'
  })

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900">Spacing</h2>
      <p className="mb-4 text-sm text-gray-500">All values are in px.</p>

      <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500">Scale</h3>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        {Object.entries(spacing.scale).map(([key, value]) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <div
              className="rounded bg-blue-500"
              style={{ width: `${value}px`, height: `${value}px`, minWidth: 4, minHeight: 4 }}
            />
            <span className="text-xs text-gray-500">
              {key} · {value}px
            </span>
          </div>
        ))}
      </div>

      <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500">Semantic</h3>
      {anyOutOfSync && (
        <p className="mb-2 text-sm text-amber-600">
          ⚠ Some tokens haven't been applied to globals.css yet — run <code>/sync-tokens</code> to pick up the latest values.
        </p>
      )}
      {semanticTokens.length === 0 ? (
        <SemanticScaleEmptyState example='"card-padding": "{spacing.scale.md}"' />
      ) : (
        <div className="flex flex-wrap gap-4">
          {semanticTokens.map((token) => (
            <ScaleTokenPreview
              key={token.path}
              token={token}
              syncStatus={getSyncStatus(token.cssVarKey, token.value ? `${token.value}px` : null, cssVars)}
              render={(px) => (
                <div
                  className="rounded bg-blue-500"
                  style={{ width: px, height: px, minWidth: 4, minHeight: 4 }}
                />
              )}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// Any top-level key in design-guideline.json shaped like { scale, semantic } is a
// scale category, same as spacing/border-radius — see .claude/skills/sync-tokens/SKILL.md.
// Categories without a bespoke section below (SpacingSection, BorderRadiusSection) fall
// through to GenericScaleSection so a brand-new category (e.g. shadow) still shows up
// here with correct sync-status warnings, with no code changes required.
function isScaleGroup(value: unknown): value is ScaleGroup {
  if (typeof value !== 'object' || value === null) return false
  const { scale, semantic } = value as Record<string, unknown>
  return typeof scale === 'object' && scale !== null && typeof semantic === 'object' && semantic !== null
}

const KNOWN_TOP_LEVEL_KEYS = new Set(['palette', 'semantic', 'typography', 'spacing', 'border-radius'])

function GenericScaleSection({ categoryKey, group }: { categoryKey: string; group: ScaleGroup }) {
  const title = categoryKey.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')
  const cssVars = extractCssScaleVars(globalsCssRaw, categoryKey)
  const semanticTokens = resolveScaleSemantic(group.semantic, dataRoot)
  const anyOutOfSync = semanticTokens.some(
    (token) => getSyncStatus(token.cssVarKey, token.value, cssVars) !== 'synced' && token.value
  )

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mb-4 text-sm text-gray-500">
        New token category found in design-guideline.json — showing raw values until this section
        gets a custom preview.
      </p>

      <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500">Scale</h3>
      <div className="mb-6 flex flex-wrap gap-3">
        {Object.entries(group.scale).map(([key, value]) => (
          <div key={key} className="flex flex-col items-center gap-1 rounded-[8px] border border-gray-200 px-3 py-2">
            <span className="max-w-[16rem] whitespace-normal wrap-break-word font-mono text-[11px] text-gray-700">
              {value || '—'}
            </span>
            <span className="text-xs text-gray-500">{key}</span>
          </div>
        ))}
      </div>

      <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500">Semantic</h3>
      {anyOutOfSync && (
        <p className="mb-2 text-sm text-amber-600">
          ⚠ Some tokens haven't been applied to globals.css yet — run <code>/sync-tokens</code> to pick up the latest values.
        </p>
      )}
      {semanticTokens.length === 0 ? (
        <SemanticScaleEmptyState example={`"example-role": "{${categoryKey}.scale.<step>}"`} />
      ) : (
        <div className="flex flex-wrap gap-3">
          {semanticTokens.map((token) => {
            const syncStatus = getSyncStatus(token.cssVarKey, token.value, cssVars)
            const showWarning = syncStatus === 'stale' || syncStatus === 'not-synced'
            return (
              <div key={token.path} className="flex flex-col items-center gap-1">
                <div className="relative rounded-[8px] border border-gray-200 px-3 py-2">
                  <span className="max-w-[16rem] whitespace-normal wrap-break-word font-mono text-[11px] text-gray-700">
                    {token.value || '—'}
                  </span>
                  {showWarning && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold leading-none text-amber-950 ring-2 ring-white">
                      !
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{token.path}</span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function BorderRadiusSection({
  radius,
  cssVars,
}: {
  radius: ScaleGroup
  cssVars: Record<string, string>
}) {
  const semanticTokens = resolveScaleSemantic(radius.semantic, dataRoot)
  const anyOutOfSync = semanticTokens.some((token) => {
    const status = getSyncStatus(token.cssVarKey, token.value ? `${token.value}px` : null, cssVars)
    return status === 'stale' || status === 'not-synced'
  })

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900">Border Radius</h2>

      <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500">Scale</h3>
      <div className="mb-6 flex flex-wrap gap-4">
        {Object.entries(radius.scale).map(([key, value]) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <div
              className="h-16 w-16 border-2 border-blue-500 bg-blue-50"
              style={{ borderRadius: `${value}px` }}
            />
            <span className="text-xs text-gray-500">
              {key} · {value}px
            </span>
          </div>
        ))}
      </div>

      <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500">Semantic</h3>
      {anyOutOfSync && (
        <p className="mb-2 text-sm text-amber-600">
          ⚠ Some tokens haven't been applied to globals.css yet — run <code>/sync-tokens</code> to pick up the latest values.
        </p>
      )}
      {semanticTokens.length === 0 ? (
        <SemanticScaleEmptyState example='"button-radius": "{border-radius.scale.sm}"' />
      ) : (
        <div className="flex flex-wrap gap-4">
          {semanticTokens.map((token) => (
            <ScaleTokenPreview
              key={token.path}
              token={token}
              syncStatus={getSyncStatus(token.cssVarKey, token.value ? `${token.value}px` : null, cssVars)}
              render={(px) => <div className="h-12 w-12 border-2 border-blue-500 bg-blue-50" style={{ borderRadius: px }} />}
            />
          ))}
        </div>
      )}
    </section>
  )
}

const extraScaleCategories = Object.entries(dataRoot).filter(
  ([key, value]) => !KNOWN_TOP_LEVEL_KEYS.has(key) && isScaleGroup(value)
) as [string, ScaleGroup][]

export function DesignGuideline() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 p-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Design Guideline</h1>
        <p className="mt-1 text-sm text-gray-500">
          Reads design-guideline.json directly — save the file and see it live. Hover a swatch to see
          which palette step it points to.
        </p>
      </header>
      <PaletteSection palette={data.palette} />
      <SemanticSection semantic={data.semantic} palette={data.palette} />
      <TypographySection typography={data.typography} />
      <SpacingSection spacing={data.spacing} cssVars={cssSpacingVars} />
      <BorderRadiusSection radius={data['border-radius']} cssVars={cssRadiusVars} />
      {extraScaleCategories.map(([key, group]) => (
        <GenericScaleSection key={key} categoryKey={key} group={group} />
      ))}
    </div>
  )
}
