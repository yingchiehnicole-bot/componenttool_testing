#!/usr/bin/env node
// Regenerates src/components/Icons/ from every SVG in assets/icons/.
// Invoked by the sync-icons skill — designers never run this directly,
// they just ask Claude to sync icons.
//
// Usage: node .claude/skills/sync-icons/generate-icons.mjs

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join, basename } from 'node:path'

const ROOT = process.cwd()
const SOURCE_DIR = join(ROOT, 'assets/icons')
const OUTPUT_DIR = join(ROOT, 'src/components/Icons')
const COMPONENTS_DIR = join(OUTPUT_DIR, 'iconComponents')

const ATTR_MAP = {
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-opacity': 'strokeOpacity',
  'fill-rule': 'fillRule',
  'fill-opacity': 'fillOpacity',
  'clip-rule': 'clipRule',
  'clip-path': 'clipPath',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  class: 'className',
  'xlink:href': 'xlinkHref',
}

// Naming convention: icon_<name>_<type>.svg (type is optional), e.g.
// icon_home_fill.svg -> HomeFillIcon. The leading "icon" word is dropped
// so it doesn't double up with the `Icon` suffix this script always
// appends (icon_home.svg -> HomeIcon, not IconHomeIcon).
//
// A filename that doesn't follow the convention (no leading "icon" word)
// is used as-is — PascalCased with `Icon` appended — instead of guessing
// at what the designer meant.
function toIconName(filename) {
  const base = basename(filename, '.svg')
  const conventionMatch = base.match(/^icon[-_\s]+(.+)$/i)
  const nameSource = conventionMatch ? conventionMatch[1] : base
  const words = nameSource.split(/[-_\s]+/).filter(Boolean)
  const pascal = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('')
  return `${pascal}Icon`
}

function convertAttrs(markup) {
  let out = markup
  for (const [from, to] of Object.entries(ATTR_MAP)) {
    out = out.split(`${from}=`).join(`${to}=`)
  }
  return out
}

// A <defs><clipPath id="X"><rect width="W" height="H".../></clipPath></defs>
// whose rect exactly covers the viewBox is a no-op export artifact (common
// from Figma) — drop it and the clip-path="url(#X)" reference that used it,
// rather than shipping an id every instance of the icon would collide on
// if rendered more than once on the same page.
function stripNoopClip(markup, viewBox) {
  const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number)
  const defsMatch = markup.match(
    /<defs>\s*<clipPath id="([^"]+)">\s*<rect width="(\d+)" height="(\d+)"[^/]*\/>\s*<\/clipPath>\s*<\/defs>/
  )
  if (!defsMatch) return markup
  const [full, id, w, h] = defsMatch
  if (Number(w) !== vbWidth || Number(h) !== vbHeight) return markup
  const withoutDefs = markup.replace(full, '')
  return withoutDefs.split(` clip-path="url(#${id})"`).join('')
}

// Single-tone icons (one fill/stroke color throughout) inherit text color
// instead of shipping a hardcoded one, matching the rest of the design
// system. Multi-color icons (brand marks, not UI glyphs) are left as-is.
function replaceSingleColorWithCurrentColor(markup) {
  const seen = new Map()
  const re = /(?:fill|stroke)="([^"]+)"/g
  let m
  while ((m = re.exec(markup))) {
    const raw = m[1]
    if (raw.toLowerCase() === 'none') continue
    seen.set(raw.toLowerCase(), raw)
  }
  if (seen.size !== 1) return markup
  const [color] = seen.values()
  return markup.split(`fill="${color}"`).join('fill="currentColor"').split(`stroke="${color}"`).join('stroke="currentColor"')
}

function convertSvgToComponent(name, raw) {
  const tagMatch = raw.match(/<svg([^>]*)>([\s\S]*)<\/svg>/)
  if (!tagMatch) throw new Error(`Could not parse <svg> markup for ${name}`)
  const [, rootAttrs, innerRaw] = tagMatch

  const viewBoxMatch = rootAttrs.match(/viewBox="([^"]+)"/)
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24'
  const rootFillMatch = rootAttrs.match(/\bfill="([^"]+)"/)
  const rootFill = rootFillMatch ? rootFillMatch[1] : 'none'

  let inner = innerRaw.trim()
  inner = stripNoopClip(inner, viewBox)
  inner = replaceSingleColorWithCurrentColor(inner)
  inner = convertAttrs(inner)
  const indented = inner
    .split('\n')
    .map((line) => `      ${line.trim()}`)
    .join('\n')

  return `import { type SVGProps } from 'react'

export function ${name}(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="${viewBox}" fill="${rootFill}" {...props}>
${indented}
    </svg>
  )
}
`
}

function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.log(JSON.stringify({ error: 'assets/icons/ does not exist — nothing to sync.' }))
    return
  }
  const svgFiles = readdirSync(SOURCE_DIR).filter((f) => f.endsWith('.svg'))
  if (svgFiles.length === 0) {
    console.log(JSON.stringify({ error: 'No SVG files in assets/icons/ — nothing to sync.' }))
    return
  }

  mkdirSync(COMPONENTS_DIR, { recursive: true })

  const currentNames = new Set()
  const added = []
  const updated = []

  for (const file of svgFiles) {
    const name = toIconName(file)
    currentNames.add(name)
    const raw = readFileSync(join(SOURCE_DIR, file), 'utf-8')
    const component = convertSvgToComponent(name, raw)

    // All icon components live flat in one shared folder: src/components/Icons/iconComponents/<Name>.tsx
    const componentPath = join(COMPONENTS_DIR, `${name}.tsx`)
    const existed = existsSync(componentPath)
    const previous = existed ? readFileSync(componentPath, 'utf-8') : null
    if (previous !== component) {
      writeFileSync(componentPath, component)
      ;(existed ? updated : added).push(name)
    }
  }

  const removed = []
  const existingFiles = readdirSync(COMPONENTS_DIR).filter((f) => f.endsWith('.tsx'))
  for (const file of existingFiles) {
    const name = basename(file, '.tsx')
    if (!currentNames.has(name)) {
      rmSync(join(COMPONENTS_DIR, file), { force: true })
      removed.push(name)
    }
  }

  const sortedNames = [...currentNames].sort()
  const indexContent = sortedNames.map((n) => `export { ${n} } from './iconComponents/${n}'`).join('\n') + '\n'
  writeFileSync(join(OUTPUT_DIR, 'index.ts'), indexContent)

  console.log(JSON.stringify({ added, updated, removed, all: sortedNames }, null, 2))
}

main()
