---
description: Collect brand information from the designer and generate `design-guideline.json`
---

## Before starting — Check for existing file

1. If `design-guideline.json` already exists in the project, read it and display it to the designer, then ask: "Here's your current design guideline — what would you like to change?" Skip Steps 1–3 and go directly to Step 4.
2. If the designer has attached or shared a JSON file, use that directly. Skip Steps 1–3 and go directly to Step 4.
3. If neither, proceed with Steps 1–3 to collect brand information from scratch.

## Step 1 — Collect brand information

Ask the designer one question at a time. After each answer, acknowledge it briefly, then ask the next question. Do not list all questions at once. Accept answers in any form — typed values, hex codes, screenshots, Figma exports, or a JSON file. If the designer shares a screenshot or image, extract the color values visually.

1. **Colors** — "What are your brand colors? You can share hex values, a screenshot, or describe them. What name would you give each color? (e.g. 'green', 'ocean', 'sand')"
2. **Neutrals** — "What gray or neutral color do you use?"
3. **Feedback colors** — "Do you have specific colors for error, success, warning, and info? Or should I use standard red/green/yellow/blue?"
4. **Semantic roles** — "How do you want to name your color tokens? Here are some examples — adjust freely:
   - `brand.primary`, `brand.hover`, `brand.subtle`
   - `text.default`, `text.muted`, `text.inverse`
   - `surface.page`, `surface.card`
   - `feedback.error`, `feedback.success`

   These become Tailwind classes like `bg-brand-primary`. What works for you?"
5. **Fonts** — "What font do you use for headings? What about body text? Are these Google Fonts or system fonts?"
6. **Dark mode** — "Do you need dark mode support?"

## Step 2 — Generate the color scale

For each color the designer provides, generate a 10-step scale (100–1000) if only one or a few hex values were given. Derive lighter steps by increasing lightness, darker steps by decreasing lightness. The provided hex value should land near step 500–600.

If the designer provides a full scale already, use those values directly.

## Step 3 — Write design-guideline.json

Use the designer's own category and token names for `semantic`. There is no fixed structure — define exactly what was described in Step 1.

```json
{
  "palette": {
    "<color-name>": {
      "100": "#...", "200": "#...", "300": "#...", "400": "#...", "500": "#...",
      "600": "#...", "700": "#...", "800": "#...", "900": "#...", "1000": "#..."
    },
    "white": "#FFFFFF",
    "black": "#000000"
  },
  "semantic": {
    "light": {
      "<category>": {
        "<token>": "{palette.<color-name>.<step>}"
      }
    },
    "dark": {
      "<category>": {
        "<token>": "{palette.<color-name>.<step>}"
      }
    }
  },
  "typography": {
    "fonts": { "display": "<font>", "body": "<font>" },
    "imports": ["<google-fonts-url>"]
  },
  "spacing": {
    "scale": { "2xs": "2", "xs": "4", "sm": "8", "md": "16", "lg": "24", "xl": "32", "2xl": "48", "3xl": "64" },
    "semantic": {}
  },
  "border-radius": {
    "scale": { "sm": "12", "md": "24", "lg": "40", "xl": "60" },
    "semantic": {}
  }
}
```

Rules:
- Use the designer's actual color names as palette keys (e.g. `"ocean"`, `"sand"`)
- `palette.white` and `palette.black` are always available without defining them
- Omit `semantic.dark` entirely if dark mode is not needed
- Feedback colors default to standard red/green/yellow/blue if not specified — add those to the palette
- Spacing and border-radius values are unitless numbers (e.g. `"8"` means 8px — the unit is added by `/sync-tokens`)
- Copy `spacing.scale` and `border-radius.scale` from the defaults above unless the designer specifies otherwise
- Leave `spacing.semantic` and `border-radius.semantic` as empty objects — don't ask the designer to name these upfront. Unlike colors, spacing/radius roles (e.g. `"card-padding"`, `"button-radius"`) only make sense once a real component needs one, so they get added later (typically by `/generate-component`), each referencing a scale step: `"card-padding": "{spacing.scale.md}"`
- For Google Fonts, generate the full import URL from the font name (e.g. `"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"`)
- Leave `"imports": []` if only system fonts are used

## Step 4 — Show and confirm

Display the generated `design-guideline.json` to the designer and ask:

> Here's your `design-guideline.json`. Does everything look right? Let me know if you'd like to adjust any colors, rename any categories or tokens, or change which palette step maps to which role.

Wait for confirmation before writing the file. Apply any requested changes, then write `design-guideline.json`.

## Step 5 — Next step

After writing the file, tell the designer:

> Your design tokens are saved. Run `npm run storybook` and open **Foundations → Design Guideline** to see them WYSIWYG — palette, semantic colors (with a light/dark toggle), typography, spacing, and border radius. Hover any semantic color swatch to see which palette step it points to.
>
> When you're ready to apply them to Tailwind, run `/sync-tokens`.
>
> If you want to change anything — colors, fonts, token names — just tell me directly and I'll update the file for you.

The Design Guideline page (`src/foundations/DesignGuideline/`) reads `design-guideline.json` directly, so it reflects edits immediately — no need to regenerate it. It ships with the template; you only need to create it if it's missing (see the `design-guideline-page` skill).
