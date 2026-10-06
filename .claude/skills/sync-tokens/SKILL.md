---
description: Sync design tokens from `design-guideline.json` into `src/styles/globals.css`
---

## Step 1 — Read design-guideline.json

Read the file and extract:
- `palette` — all color steps and their hex values
- `semantic.light` — token references (required)
- `semantic.dark` — token references (optional; absent means no dark mode)
- `typography.fonts` and `typography.imports`
- Every other top-level key whose value has both a `scale` object and a `semantic` object — call these **scale categories**. `spacing` and `border-radius` are the two that ship by default, but treat this as a general rule: if the designer (or a previous step) added a new key like `shadow` in this same shape, it's a scale category too, and everything below applies to it automatically — this file does not need to be edited to support it.
  - `<category>.scale` — the raw step scale (required)
  - `<category>.semantic` — named roles that reference a scale step (optional; often empty until components need one)

## Step 2 — Check if semantic tokens are filled

Count how many values in `semantic.light` are empty strings (`""`).

If more than half are empty, stop and explain to the designer:

> Your `semantic` tokens are not filled in yet. Each value should reference a palette step using this syntax:
>
> ```
> "{palette.brand.600}"
> "{palette.neutral.100}"
> "{palette.white}"
> "{palette.black}"
> ```
>
> The path follows the structure of your `palette` object. Fill in `semantic.light` (and `semantic.dark` if needed) in `design-guideline.json`, then run `/sync-tokens` again.

If semantic tokens are sufficiently filled, continue to Step 3.

## Step 3 — Resolve references

References point at a scale step and always include the full path from the JSON root, including the domain name.

- Color: `{palette.brand.600}` → look up `palette.brand["600"]`. Also `{palette.white}` → `#FFFFFF`, `{palette.black}` → `#000000`.
- Any scale category: `{<category>.scale.<step>}` → look up `<category>.scale["<step>"]`. This is the same rule for `spacing`, `border-radius`, or any other scale category — the category name in the reference must match the key it lives under.

Skip a token if:
- The semantic value itself is empty (`""`)
- The referenced path does not exist or is empty

## Step 4 — Derive CSS variable names

CSS variable names are derived automatically from the token path.

**Color tokens** — Rule: `semantic.light.<category>.<token>` → `--color-<category>-<token>`

| Token path example | CSS variable |
|---|---|
| `semantic.light.brand.primary` | `--color-brand-primary` |
| `semantic.light.brand.hover` | `--color-brand-hover` |
| `semantic.light.text.default` | `--color-text-default` |
| `semantic.light.text.muted` | `--color-text-muted` |
| `semantic.light.surface.page` | `--color-surface-page` |
| `semantic.light.feedback.error` | `--color-feedback-error` |
| *(any category).(any token)* | `--color-<category>-<token>` |

Dark mode uses the same variable names but sourced from `semantic.dark`.

**Scale categories** (spacing, border-radius, and any other `{scale, semantic}` key) — scale steps and semantic roles share the same CSS namespace per category, so a semantic role name must never collide with a scale step name in the same category.

For each scale category, first work out two things:

1. **CSS variable prefix** — `spacing` → `spacing`, `border-radius` → `radius` (these two are historical exceptions). Any other category → its own key name, unchanged (e.g. `shadow` → `shadow`).
2. **Unit suffix** — `spacing` and `border-radius` append `px` to numeric values (also a historical exception, e.g. `"8"` → `8px`). Any other category has no suffix — write the resolved value exactly as it appears in JSON, whatever it is (a bare number, a string with its own unit, or a multi-part CSS value like a shadow). If a new category's values need a unit, write the unit directly in `design-guideline.json` (e.g. `"200ms"`) rather than relying on this skill to add one.

Then apply:

| Source | CSS variable |
|---|---|
| `typography.fonts.display` | `--font-display` |
| `typography.fonts.body` | `--font-body` |
| `<category>.scale.<key>` | `--<prefix>-<key>` |
| `<category>.semantic.<role>` | `--<prefix>-<role>` |

## Step 5 — Write to globals.css

Read `src/styles/globals.css` and apply the following changes:

### 5a — Font imports
If `typography.imports` has entries, add each URL as an `@import` at the very top of the file, before `@import "tailwindcss"`. Skip any URL already present.

### 5b — Light mode colors
Replace everything between `/* COLORS:START */` and `/* COLORS:END */` inside `@theme { }` with the resolved light mode color variables, one per line, indented two spaces.

### 5c — Dark mode colors
If `semantic.dark` exists: replace everything between `/* COLORS:START */` and `/* COLORS:END */` inside the `@media (prefers-color-scheme: dark)` block with the resolved dark mode color variables.

If `semantic.dark` is absent: replace the same block with a single comment `/* dark mode not configured */`.

### 5d — Typography
Fill in `--font-display` and `--font-body` in `@theme { }`. Quote names that contain spaces, e.g. `--font-display: "Fraunces";`.

### 5e — Scale categories (spacing, border-radius, and any others)
For each scale category found in Step 1, resolve every `scale` entry and every `semantic` entry into `--<prefix>-<key>: <value><unit>;` lines (using the prefix and unit rules from Step 4).

Then, inside `@theme { }`, look for a block marked `/* <PREFIX-UPPER>:START */` ... `/* <PREFIX-UPPER>:END */` (e.g. `/* SPACING:START */`, `/* SHADOW:START */`):

- **If the block exists**, replace everything between the two markers with the resolved lines. Leave it empty if the category's `scale` and `semantic` are both empty — that's the normal state until a component needs one.
- **If the block does not exist** (this is the first time this category has been synced), insert a new one just before the closing `}` of `@theme { }`:
  ```
  /* <Title Case category name> (scale + semantic) */
  /* <PREFIX-UPPER>:START */
  /* <PREFIX-UPPER>:END */
  ```
  then fill it the same way. This is what makes a brand-new category (e.g. a `shadow` section added by hand or by another skill) sync correctly the very first time, with no manual edits to `globals.css` or to this skill first.

## Step 6 — Report

Tell the designer:
- How many color tokens were applied
- Which scale categories were synced, and call out any that got a brand-new block in `globals.css` for the first time
- Which tokens were skipped (empty or unresolved), so they know what still needs to be filled in
- A sample of the Tailwind utility classes now available (e.g. `bg-brand-primary`, `text-text-default`, and any semantic spacing/radius roles like `p-card-padding`, `rounded-button`)
