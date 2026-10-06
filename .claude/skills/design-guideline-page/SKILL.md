---
description: How the Design Guideline preview page works — structure, token resolution, and how to extend it
---

## What this page is

`src/foundations/DesignGuideline/` is a Storybook-only page (title `Foundations/Design Guideline`) that renders `design-guideline.json` WYSIWYG — palette, semantic colors (light/dark), typography, and a Scale/Semantic layer for both spacing and border radius. It is **not** a library component:

- It lives under `src/foundations/`, not `src/components/` — never add it to `src/components/index.ts` or `src/index.ts`. It must not ship in the published npm package.
- It has no `SPEC.md` and no variant props — the `spec-component` and `core-components` conventions for library components don't apply to it.
- It ships once with the template. `/setup-design-guideline` does not regenerate it — the page reads `design-guideline.json` directly, so edits to that file show up immediately (Storybook HMR) without touching the page.

## Why it reads the JSON directly, and cross-checks `globals.css` separately

`/sync-tokens` resolves `{palette.brand.600}`-style references into final hex values and writes them into `globals.css`. Once resolved, the reference is gone — there's no way to show "this semantic token points to that palette step" from CSS alone.

So `DesignGuideline.tsx` imports `design-guideline.json` directly (`resolveJsonModule` is enabled in `tsconfig.json` for this) and resolves references itself via `resolveToken.ts`, which mirrors the `/sync-tokens` Step 3 resolution rules. This keeps the raw reference (`{palette.brand.600}`), the resolved path (`palette.brand.600`), and the final hex all available together — that's what powers the hover tooltip on each semantic swatch.

Reading only the JSON has a gap though: if `design-guideline.json` was edited after the last `/sync-tokens` run (or `globals.css` was hand-edited), the page would show colors that don't match what components actually render. To catch that, `DesignGuideline.tsx` also imports `globals.css` as a raw string (`?raw`, typed via `src/foundations/vite-env.d.ts`) and `cssSync.ts` parses out the `--color-*` variables actually written there, split into light/dark by the `@media (prefers-color-scheme: dark)` marker — this mirrors the `/sync-tokens` Step 4 variable-naming rule (`--color-<category>-<token>`). Each semantic token's JSON-resolved hex is compared against the matching CSS variable; a mismatch or missing variable renders an amber "!" badge on the swatch and a warning line in the tooltip telling the designer to run `/sync-tokens`.

So: **JSON is the source of truth for the reference chain, `globals.css` is only consulted to flag drift.** If you change how `/sync-tokens` resolves references or names CSS variables, update `resolveToken.ts` and `cssSync.ts` to match.

## Spacing and border radius are a two-tier scale, same idea as colors

`spacing` and `border-radius` in `design-guideline.json` each have a `scale` (raw steps, e.g. `sm: "8"`) and a `semantic` object (named roles that reference a step, e.g. `"card-padding": "{spacing.scale.md}"`) — the same palette-vs-semantic split as colors, so it gets the same hover traceability and sync-status badges. Unlike colors, `semantic` here is expected to start **empty**: spacing/radius roles only make sense once a real component needs one (see `/setup-design-guideline` Step 3), so don't treat an empty `semantic` object as an incomplete guideline.

Because these references carry their own domain in the path (`{spacing.scale.md}`, `{border-radius.scale.sm}` — unlike `{palette.x.y}`, which is scoped to the `palette` sub-tree), resolution in `resolveScaleToken.ts` walks the *whole* `design-guideline.json` object from the root, not a sub-tree. `resolveToken.ts` (colors) and `resolveScaleToken.ts` (spacing/radius) are deliberately kept as separate small modules rather than unified into one generic resolver — colors need the `hex` field and a palette sub-root, scale tokens need a `value` field and full-root resolution; forcing them through one shared function would need branching that isn't worth the indirection.

`cssSync.ts`'s `extractCssScaleVars(css, prefix)` parses `--spacing-*` / `--radius-*` (note: `border-radius` maps to the `radius` CSS prefix, not `border-radius` — see `/sync-tokens` Step 4) the same way `extractCssColorVars` parses `--color-*`, just without a light/dark split (spacing/radius don't change with color scheme). `getSyncStatus` is shared across colors and scale tokens — callers just need to pass the value already in its final CSS form (a hex string for colors, `"16px"` for scale tokens).

## File structure

```
src/foundations/
  vite-env.d.ts                        ← ambient module decl for `*.css?raw` imports
  DesignGuideline/
    DesignGuideline.tsx                ← page: Palette, Semantic, Typography, Spacing, Border Radius sections
    DesignGuideline.stories.tsx        ← single Storybook story, title: 'Foundations/Design Guideline'
    resolveToken.ts                     ← resolves {palette.x.y} references (colors), used for hover tooltips
    resolveScaleToken.ts                ← resolves {spacing.scale.x} / {border-radius.scale.x} references
    cssSync.ts                          ← parses globals.css color/spacing/radius vars, flags drift vs the JSON
  Logos/
    Logos.tsx                          ← separate page, title: 'Foundations/Logos' — see below
    Logos.stories.tsx
```

## The Logos page is a separate, simpler sibling

`src/foundations/Logos/Logos.tsx` reads the same `design-guideline.json` but is intentionally its own page, not a section inside `DesignGuideline.tsx` — logo has no palette/scale reference chain to resolve, so it doesn't need `resolveToken.ts`, sync-status badges, or a light/dark toggle.

- The template ships with **no logo** and no logo asset files — `logo` is absent from `design-guideline.json` until `/setup-logo` adds it. Never hardcode or re-add a logo image to this template; the placeholder state is the shipped default, by design (see project history: a template must not carry any one team's brand mark).
- `logo.light` / `logo.dark` are optional inline SVG strings (not file paths, not base64) — same "literal value in the JSON" approach as `palette` hex codes. Missing either key is normal, not an error.
- Unset renders a dashed-border checkerboard circle (mark) and rectangle (name) — reusing `CHECKERBOARD_STYLE` from the same pattern as `DesignGuideline.tsx`'s empty/unresolved tokens — with a hover tooltip pointing the designer at `/setup-logo`. Once `logo.light` or `logo.dark` is set, that placeholder is replaced by the real SVG and the tooltip no longer renders.
- `/setup-logo` (not `/setup-design-guideline`) owns writing the `logo` key — kept as a separate skill since collecting a logo file is a different flow (file/image upload) from collecting hex values and font names.

Storybook is configured to scan `src/foundations/**` in `.storybook/main.ts` — if you add another foundations page (e.g. an icon or elevation gallery), it's picked up automatically as long as it follows the same `*.stories.tsx` pattern.

## Conventions when editing this page

- **Colors are always inline styles** (`style={{ backgroundColor: hex }}`), never Tailwind color classes — the hex values are dynamic (read from JSON at runtime), so Tailwind's static class scanning can't pick them up.
- **`semantic` has no fixed category/token names** (see `/setup-design-guideline`) — never hardcode a category or token name. Always derive sections by iterating `Object.entries(...)`.
- **Unresolved or empty tokens** render as a checkerboard placeholder (`CHECKERBOARD_STYLE`), not a broken color — this is intentional so an incomplete guideline doesn't look like a bug.
- **Dark mode is a toggle, not side-by-side** — clicking "Dark" swaps `semantic.light` for `semantic.dark` and switches the preview panel's own background/text to a dark canvas, so token contrast is visible against a realistic backdrop. If `semantic.dark` is absent from the JSON, the toggle button doesn't render at all.
- **Typography loads fonts itself** — `typography.imports` URLs are injected as `<link rel="stylesheet">` tags at runtime (`useGoogleFontImports`), so fonts render correctly even before `/sync-tokens` has run.
- **Sync-status badges only apply to semantic tokens** — raw scale/palette steps aren't individually cross-checked; don't add sync badges to `PaletteSection` or the Scale half of `SpacingSection`/`BorderRadiusSection`.
- **An empty `semantic` object for spacing/radius is the expected default state**, not an error — render the empty-state hint (see `SemanticScaleEmptyState`), not a warning.
