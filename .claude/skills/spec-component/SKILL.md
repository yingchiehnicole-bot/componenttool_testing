---
description: How to write a component spec (SPEC.md): file structure, required sections, writing conventions
---

Every component folder must include a `SPEC.md` written in English for designers and developers.

## File Structure

```
src/components/<ComponentName>/
  SPEC.md
```

## Required Sections

### Component Name
Use a `#` heading with the component name, followed by a one-sentence description.

### Description
2–4 sentences describing the component's purpose and use cases.

### Component Hierarchy
List any child components composed inside this component. Only include named components (imported or defined separately) — plain HTML elements like `div`, `span`, `button` are excluded.

Example:

```
ProductCard
├── Avatar
└── Badge
```

If the component has no child components, write `none`.

### Props
List all props in a table. For union/enum types, enumerate every possible value explicitly — do not use `...` or abbreviate.

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` | No | Button style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | No | Size |
| `disabled` | `boolean` | `false` | No | Disabled state |
| `onClick` | `() => void` | — | Yes | Click handler |

Rules:
- Use `Yes` / `No` in the Required column
- Use `—` for props with no default value
- Do not omit any prop, including `className` and event handlers

### Variants & States
List every variant and interactive state explicitly. Each entry must describe what it looks like or how it behaves.

**Variants** (driven by props):
- `primary` — solid blue background, white text
- `secondary` — white background, blue border and text
- `ghost` — no background, text only

**States** (driven by interaction or data):
- `disabled` — reduced opacity, not clickable
- `loading` — shows spinner, interaction blocked
- `hover` — background darkens by 10%, cursor becomes a pointer

### Usage Example
Provide the minimal working code example:

```tsx
import { Button } from '@/components/Button'

<Button variant="primary" onClick={handleClick}>
  Submit
</Button>
```

## Update Rules

- Update `SPEC.md` whenever props change or a variant is added/removed
- Remove deleted props from the table — do not leave stale entries
- Keep enum values in the Props table in sync with the TypeScript type definition
