---
description: Create a new component: ask for requirements, generate four files, run typecheck
---

Create a new component based on the designer's description.

## Step 1: Ask for Component Info

Ask the designer:
1. What is the component name? (will be created in PascalCase)
2. What does this component do? What variants or states should it have?

## Step 2: Read Design Tokens

Read `src/styles/globals.css` and note all tokens defined in the `@theme` block. Use those exact names as Tailwind classes when writing the component.

## Step 3: Create Four Files

Inside `src/components/<ComponentName>/` create:

1. `<ComponentName>.tsx` — write the component following the core-components skill conventions
2. `<ComponentName>.stories.tsx` — write stories following the storybook skill conventions
3. `index.ts` — export the component and Props type
4. `SPEC.md` — write a component spec following the spec-component skill conventions

Then add to `src/components/index.ts`:
```ts
export * from './<ComponentName>'
```

## Step 3: Run Typecheck

```bash
npm run typecheck
```

Fix any errors and re-run until it passes.

When done, tell the designer: the component is ready and can be previewed in Storybook.
