import type { Meta, StoryObj } from '@storybook/react-vite'
import { Logos } from './Logos'

const meta: Meta<typeof Logos> = {
  title: 'Foundations/Logos',
  component: Logos,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Logos>

export const Placeholder: Story = {}
