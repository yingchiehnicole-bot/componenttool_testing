---
description: Modify an existing component: adjust styles or behavior per conventions, run typecheck
---

Modify an existing component based on the designer's description.

## Step 1: Confirm Which Component to Edit

Ask the designer:
1. Which component should be modified?
2. What should be changed? (styles, new prop, behavior adjustment)

## Step 2: Read the Existing Code

Read `src/styles/globals.css` to note available design tokens, then read the component's `.tsx` file and `SPEC.md` (if it exists) to understand the current structure before making changes.

## Step 3: Make Changes

Follow the core-components skill conventions when editing:
- Do not break the existing Props interface (unless explicitly asked)
- Keep `className` prop support
- Use only Tailwind for styles — no standalone CSS

If the Story needs updating, modify `.stories.tsx` as well.
Update `SPEC.md` to reflect any changes following the spec-component skill conventions.

## Step 4: Run Typecheck

```bash
npm run typecheck
```

Fix any errors and re-run until it passes.

When done, tell the designer what was changed and whether anything else was affected.
