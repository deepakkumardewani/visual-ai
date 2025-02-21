# Storybook Documentation

This project uses Storybook for component development and documentation. Each component has its own story file that demonstrates its various states and usage patterns.

## Running Storybook

```bash
# Start Storybook development server
npm run storybook

# Build Storybook for production
npm run build-storybook
```

## Story File Structure

Story files are located alongside their components with the naming convention `[ComponentName].stories.ts`. Each story file includes:

1. Default export with component metadata
2. Named exports for each component state/variant
3. Props and slots documentation
4. Component description

## Best Practices

1. **Component Organization**

   - Place stories alongside their components
   - Use meaningful category names in the story title
   - Group related components together

2. **Story Creation**

   - Show all important component states
   - Document props and events
   - Include mobile/responsive variations
   - Test edge cases (long text, error states, etc.)

3. **State Management**

   - Use Pinia store decorators when needed
   - Mock API calls and external dependencies
   - Provide realistic data samples

4. **Styling**
   - Use Tailwind CSS classes with `tw-` prefix
   - Ensure dark/light theme compatibility
   - Test with different viewport sizes

## Adding New Stories

1. Create a new story file: `[ComponentName].stories.ts`
2. Import your component and required dependencies
3. Define the component metadata
4. Create stories for different states
5. Add documentation and descriptions

Example:

```typescript
import type { Meta, StoryObj } from '@storybook/vue3'

import YourComponent from './YourComponent.vue'

const meta = {
  title: 'Category/YourComponent',
  component: YourComponent,
  tags: ['autodocs'],
  argTypes: {
    // Define your props here
  }
} satisfies Meta<typeof YourComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    // Define your default props
  }
}
```

## Testing in Storybook

1. Test component interactions
2. Verify responsive behavior
3. Check accessibility features
4. Test with different themes
5. Validate error states

## Useful Addons

- **@storybook/addon-essentials**: Core addons for development
- **@storybook/addon-interactions**: Test user interactions
- **@storybook/addon-styling**: Style/theme testing
- **@storybook/addon-viewport**: Responsive design testing
