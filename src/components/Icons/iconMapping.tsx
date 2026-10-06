import { type ReactNode } from 'react'
import * as Icons from './index'

// Shared source for any component's Storybook `select` + `mapping` control
// over an icon prop (leftIcon, rightIcon, etc.) — see the storybook skill's
// "Icon (and other ReactNode) props" section. Built from the icon barrel
// export, so it stays in sync automatically as sync-icons adds or removes
// icons — nothing here needs to be hand-maintained.
export const iconMapping: Record<string, ReactNode> = {
  None: undefined,
  ...Object.fromEntries(
    Object.entries(Icons).map(([name, IconComponent]) => [name, <IconComponent className="w-4 h-4" />])
  ),
}
