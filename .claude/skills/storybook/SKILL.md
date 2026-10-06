---
description: How to write Storybook stories: file structure, required setup, Story examples
---

## Story File Structure

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],       // required for auto-generated docs
}

export default meta
type Story = StoryObj<typeof Button>
```

---

## Rules

- `tags: ['autodocs']` is required
- `title` format: `Components/<ComponentName>`
- Each file should have at least **2–3 Stories** showing different states or variants
- Story names should be in **English**, descriptive and designer-friendly

---

## Story Examples

```tsx
// Basic usage
export const Primary: Story = {
  args: {
    children: 'Submit',
    variant: 'primary',
  },
}

// Variant
export const Secondary: Story = {
  args: {
    children: 'Cancel',
    variant: 'secondary',
  },
}

// State
export const Disabled: Story = {
  args: {
    children: 'Unavailable',
    disabled: true,
  },
}
```

---

## Icon (and other ReactNode) props

A prop typed `ReactNode` (see the core-components skill's "Icon Props" section — `leftIcon`, `rightIcon`, etc.) can't get a plain Storybook control; a raw JSX element isn't something the Controls panel can render as a dropdown. Instead, give the designer a `select` control and use `mapping` to resolve each option to the real, pre-sized icon element.

Every icon-accepting component's story shares the same source for this — `src/components/Icons/iconMapping.tsx` — instead of each one redefining its own list of icons. It's built from the icon barrel export, so it covers every icon that currently exists and never needs manual updates as `sync-icons` adds or removes icons:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { iconMapping } from '../Icons/iconMapping'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    leftIcon: {
      control: 'select',
      options: Object.keys(iconMapping),
      mapping: iconMapping,
    },
  },
}
```

- If `src/components/Icons/iconMapping.tsx` doesn't exist yet, create it (see the sync-icons skill) — don't define a local mapping inside the component's own story file.
- A story's `args` for that prop must be set to a mapping **key** — the icon's component name, e.g. `'HomeIcon'` — not the JSX element itself. Storybook resolves it through `mapping` before the component ever sees it:

  ```tsx
  export const WithIcon: Story = {
    args: {
      children: 'Download',
      leftIcon: 'HomeIcon',
    },
  }
  ```
- Putting `leftIcon`/`rightIcon` in `argTypes` on `meta` (not on one story) gives every story in the file this dropdown in the Controls panel, not just the one story that demonstrates it.

---

## Common Story Types Reference

| Scenario | Suggested Story Name |
|----------|---------------------|
| Default style | `Default` |
| Size variants | `Small`, `Large` |
| Color/semantic variants | `Primary`, `Secondary`, `Danger` |
| Interactive states | `Disabled`, `Loading`, `Error` |
| Long text / edge cases | `LongContent` |
