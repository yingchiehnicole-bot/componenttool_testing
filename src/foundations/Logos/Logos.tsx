import { useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import guideline from '../../../design-guideline.json'

// design-guideline.json ships with no `logo` field until /setup-logo fills it in,
// so the raw import's inferred type won't include it — cast through unknown.
const logo = (guideline as unknown as { logo?: { light?: string; dark?: string } }).logo

const CHECKERBOARD_STYLE: CSSProperties = {
  backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)',
  backgroundSize: '10px 10px',
}

const TOOLTIP_WIDTH = 224
const TOOLTIP_MARGIN = 8

// Viewport-anchored tooltip rendered into a portal, matching the pattern used
// by the Design Guideline page's token swatches — see design-guideline-page skill.
function HoverTooltip({ anchor, text }: { anchor: DOMRect; text: string }) {
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
      <p>{text}</p>
    </div>,
    document.body
  )
}

const HOVER_TEXT = 'Show your logo — tell Claude your brand logo and it will show up here.'

function LogoSwatch({ svg, backdrop, label }: { svg?: string; backdrop: string; label: string }) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null)

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative flex h-24 w-24 items-center justify-center rounded-[12px] border border-gray-200"
        style={{ background: backdrop }}
        onMouseEnter={(e) => !svg && setAnchor(e.currentTarget.getBoundingClientRect())}
        onMouseLeave={() => setAnchor(null)}
      >
        {svg ? (
          <div
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-gray-300"
            style={CHECKERBOARD_STYLE}
          >
            <span className="text-[10px] font-medium tracking-wide text-gray-400">LOGO</span>
          </div>
        )}
        {anchor && <HoverTooltip anchor={anchor} text={HOVER_TEXT} />}
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

export function Logos() {
  const hasLogo = Boolean(logo?.light || logo?.dark)

  return (
    <div style={{ padding: 24 }}>
      <p style={{ fontSize: 13, color: '#334155', marginBottom: 16 }}>
        {hasLogo
          ? 'Your logo, as set in design-guideline.json.'
          : 'No logo set yet — this is a placeholder showing where your logo will appear.'}
      </p>
      <div className="flex gap-8">
        <LogoSwatch svg={logo?.light} backdrop="#ffffff" label="Light background" />
        <LogoSwatch svg={logo?.dark} backdrop="#040404" label="Dark background" />
      </div>
    </div>
  )
}
