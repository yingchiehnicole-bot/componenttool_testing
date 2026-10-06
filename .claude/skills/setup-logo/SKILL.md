---
description: Collect the designer's brand logo and save it into `design-guideline.json`
---

## Before starting — check for an existing logo

1. If `design-guideline.json` already has a `logo` field, show the designer what's currently set (light/dark, mono/color — whichever variants exist) and ask if they want to replace it or add a missing variant.
2. If the designer has attached an image or SVG file, use that directly — skip to Step 2.
3. Otherwise, ask: "Do you have a logo file (SVG or image) to share, or a screenshot? You can also paste one if you don't have a file handy."

## Step 1 — Collect the logo

Accept any of: an attached SVG file, an attached image (PNG/JPG), or a screenshot. A single file is enough to start — variants (dark background, mono) are optional follow-ups, not required upfront.

Ask one question at a time:
1. "Here's the logo I'll use: [describe what was shared]. Does this look right?"
2. "Do you also want a version for dark backgrounds? If you only have one file, I can use the same one for both, or leave dark unset until you have one."

Don't ask about mono/color variants unless the designer brings it up — one version is a complete, valid setup.

## Step 2 — Convert to inline SVG

`design-guideline.json` stores the logo as an inline SVG string, the same way `palette` stores literal hex values — no external file path, no base64 image blob, so the template never depends on an asset file that could go missing.

- If the designer's file is already an SVG, read its contents and use the raw `<svg>...</svv>` markup directly (strip XML prolog / comments, keep it minimal).
- If the designer's file is a raster image (PNG/JPG) or a screenshot, you cannot vectorize it — tell the designer: "This is a photo/raster image, not an SVG, so I can't turn it into scalable vector markup. I'll need an SVG version of your logo to store it directly — if you don't have one, let me know and we can revisit this."
- Normalize the SVG's `viewBox` to be square if possible, but don't distort the mark's proportions to force it.

## Step 3 — Write to design-guideline.json

Add a top-level `logo` object:

```json
{
  "logo": {
    "light": "<svg viewBox=\"0 0 144 144\">...</svg>",
    "dark": "<svg viewBox=\"0 0 144 144\">...</svg>"
  }
}
```

Rules:
- `light` is the version shown on light backgrounds; `dark` is for dark backgrounds. Both are optional — set whichever the designer provided.
- If the designer only gave one version, set only that key. Do not duplicate it into the other key unless the designer explicitly said to reuse it for both.
- If `logo` does not exist yet, add it as a new top-level key alongside `palette`, `semantic`, etc. — don't nest it under any of those.

## Step 4 — Show and confirm

Show the designer a brief description of what was saved (not the raw SVG markup — that's not meaningful to read) and ask:

> Saved your logo. Does it look right in Storybook?

## Step 5 — Next step

Tell the designer:

> Run `npm run storybook` and open **Foundations → Logos** to see your logo in place of the placeholder.
>
> If you want to change it, just share a new file and I'll update it.

The Logos page (`src/foundations/Logos/`) reads `design-guideline.json` directly, so it reflects this edit immediately — no rebuild needed. If `logo.light` or `logo.dark` is missing, that side keeps showing the gray placeholder instead of breaking.
