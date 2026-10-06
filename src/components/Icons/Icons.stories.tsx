import type { Meta, StoryObj } from '@storybook/react'
import * as Icons from './index'

const meta: Meta = {
  title: 'Components/Icons',
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj

export const AllIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      {Object.entries(Icons).map(([name, Icon]) => (
        <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Icon style={{ width: 24, height: 24 }} />
          <span style={{ fontSize: 12, color: '#64748b' }}>{name}</span>
        </div>
      ))}
    </div>
  ),
}
