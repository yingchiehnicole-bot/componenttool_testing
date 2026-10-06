---
description: Turn SVG files in assets/icons/ into icon components, keeping src/components/Icons/ in sync
---

Convert every SVG in `assets/icons/` into a named icon component, so other components (and the designer, in Storybook) can use them. Unlike a normal component, an icon set is many small named exports living in one shared folder — not one `src/components/<ComponentName>/` per icon.

## Step 1: Find the source SVGs

Look in `assets/icons/` (create it if missing). If it's empty and the designer hasn't attached any files either, ask them where the icons are coming from:

1. **Their own icons** — ask them to drop SVG files into `assets/icons/` or attach them directly in chat, one SVG per icon.
2. **They don't have icons yet / aren't sure** — suggest a free icon set like [Google Fonts Icons](https://fonts.google.com/icons), where they can preview icons and download just the ones they need as individual SVG files. Tell them explicitly: pick only the specific icons they actually need, not the whole library — thousands of unused icon files would bloat the project for no benefit, and everything in this pipeline (naming, `currentColor`, the Storybook picker) is built around one SVG per icon, the same as if they'd drawn it themselves.

Either way, the designer ends up with individual SVG files, handled identically from here on — the pipeline doesn't care whether an icon was hand-drawn or downloaded.

If the designer attaches SVG files directly instead of pointing at the folder, save each one into `assets/icons/` first (using the file's own name, or ask what to call it), then continue as below — this keeps the folder as the single source of truth so a future sync-icons run stays in sync.

## Step 2: Run the generator script

```bash
node .claude/skills/sync-icons/generate-icons.mjs
```

This does the mechanical work in one pass:

- **Naming convention**: `icon_<name>_<type>.svg` (`<type>` optional) — e.g. `icon_home.svg` → `HomeIcon`, `icon_home_fill.svg` → `HomeFillIcon`. The leading `icon` word is dropped so it doesn't double up with the `Icon` suffix the script always appends.
- If a filename doesn't follow that convention (no leading `icon` word), the script doesn't try to guess — it PascalCases the filename as-is and appends `Icon` (e.g. `arrow-right.svg` → `ArrowRightIcon`, `my-thing.svg` → `MyThingIcon`). Tell the designer the convention if you notice they're not using it, but don't rename their files for them.
- Converts the raw SVG markup to JSX: drops hardcoded `width`/`height` on the root `<svg>` (keeps `viewBox`), camelCases kebab-case/namespaced attributes (`stroke-width` → `strokeWidth`, `class` → `className`, `xlink:href` → `xlinkHref`, etc.), and strips a no-op `<defs><clipPath>` whose rect just covers the whole viewBox (a common Figma export artifact — harmless alone, but its `id` collides if the icon is ever rendered twice on the same page).
- Recolors single-tone icons to `currentColor` so they inherit text color; leaves genuinely multi-color icons (brand marks, not UI glyphs) untouched.
- Writes each icon as a flat file in one shared folder: `src/components/Icons/iconComponents/<IconName>.tsx`. Regenerates `src/components/Icons/index.ts` as the barrel export (`export { <IconName> } from './iconComponents/<IconName>'` per icon).
- Deletes the icon's file (and its export) if its source SVG was removed from `assets/icons/`.

It prints a JSON summary — `added`, `updated`, `removed`, and `all` (every current icon name) — use `all` for Step 4.

If `src/components/Icons/` didn't exist before this run, add it to `src/components/index.ts`:

```ts
export * from './Icons'
```

## Step 3: Create the gallery story (first run only)

If `src/components/Icons/Icons.stories.tsx` doesn't exist yet, create it — it renders every exported icon automatically, so it never needs to be touched again as icons are added or removed by the script:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import * as Icons from './index'

const meta: Meta = {
  title: 'Components/Icons',
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj

export const AllIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      {Object.entries(Icons).map(([name, Icon]) => (
        <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Icon style={{ width: 24, height: 24 }} />
          <span style={{ fontSize: 12, color: '#64748b' }}>{name}</span>
        </div>
      ))}
    </div>
  ),
}
```

If it already exists, leave it alone.

## Step 3b: Create the shared icon-picker mapping (first run only)

If `src/components/Icons/iconMapping.tsx` doesn't exist yet, create it — this is what lets *any* component with an icon prop (`leftIcon`, `rightIcon`, etc.) get a Storybook dropdown of every icon, without each component's story file redefining its own list. See the storybook skill's "Icon (and other ReactNode) props" section for how components consume it.

```tsx
import { type ReactNode } from 'react'
import * as Icons from './index'

export const iconMapping: Record<string, ReactNode> = {
  None: undefined,
  ...Object.fromEntries(
    Object.entries(Icons).map(([name, IconComponent]) => [name, <IconComponent className="w-4 h-4" />])
  ),
}
```

If it already exists, leave it alone — it reads from the barrel export at build time, so it already covers every icon this run added or removed.

## Step 4: Update SPEC.md

Create or update `src/components/Icons/SPEC.md` following the spec-component skill, adapted for a set instead of a single component:

- **Props**: one shared row set — any native SVG attribute (via `SVGProps<SVGSVGElement>`), plus `className`.
- **Variants & States**: list every icon name from the script's `all` output — this is the list that must stay in sync with `index.ts`.
- **Usage Example**: show importing one icon, e.g. `import { HomeIcon } from '@/components/Icons'`.

## Step 5: Run Typecheck

```bash
npm run typecheck
```

Fix any errors and re-run until it passes. A parse failure in the script (e.g. an SVG it can't confidently convert) will show up here or in the script's own error output — fall back to converting that one icon by hand if so.

## Step 6: Tell the designer

Say what was added/removed/renamed (from the script's summary), and point them at `npm run storybook` → **Components → Icons** to see the full set.
