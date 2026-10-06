import type { Meta, StoryObj } from '@storybook/react-vite'
import { DesignGuideline } from './DesignGuideline'

const meta: Meta<typeof DesignGuideline> = {
  title: 'Foundations/Design Guideline',
  component: DesignGuideline,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof DesignGuideline>

export const Overview: Story = {}
