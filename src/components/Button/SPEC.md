# Button

A clickable button for triggering an action, with style, size, and icon variants.

## Description

Button is the standard clickable control across the library — used for form submission, confirming/canceling actions, and triggering navigation or side effects. It supports an optional icon before and/or after the label.

## Component Hierarchy

none

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|--------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` | No | Button style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | No | Size |
| `leftIcon` | `ReactNode` | — | No | Icon shown before the label, e.g. `<HomeIcon className="w-4 h-4" />` |
| `rightIcon` | `ReactNode` | — | No | Icon shown after the label, e.g. `<HomeIcon className="w-4 h-4" />` |
| `className` | `string` | — | No | Style override |
| `disabled` | `boolean` | `false` | No | Disabled state |
| `onClick` | `() => void` | — | No | Click handler |

## Variants & States

**Variants** (driven by props):
- `primary` — solid blue background, white text
- `secondary` — light gray background, dark text
- `ghost` — no background, text only, gray on hover

**Sizes**:
- `sm` — 32px tall
- `md` — 40px tall (default)
- `lg` — 48px tall

**States** (driven by interaction or data):
- `disabled` — reduced opacity, not clickable

## Usage Example

```tsx
import { Button } from '@/components/Button'
import { HomeIcon } from '@/components/Icons'

<Button variant="primary" leftIcon={<HomeIcon className="w-4 h-4" />} onClick={handleClick}>
  Download
</Button>
```
