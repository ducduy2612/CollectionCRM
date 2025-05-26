# Collection CRM UI Components

This directory contains all the UI components for the Collection CRM frontend application. The components are built using React, TypeScript, Tailwind CSS, and follow VPBank's brand guidelines.

## Design System

The design system is based on VPBank's brand colors:
- **Primary**: Green (#00a651)
- **Secondary**: Red (#cf0000)

## Component Structure

### UI Components (`/ui`)
Core reusable UI components:

- **Alert**: Notification component with variants (primary, success, warning, danger, info)
- **Avatar**: User avatar component with image support and initials fallback
- **Badge**: Status indicator badges with multiple variants
- **Button**: Primary action button with loading states and variants
- **Card**: Container component with header, content, and footer sections
- **Input**: Form input component with label, error, and icon support
- **Modal**: Dialog/modal component with confirmation dialog variant
- **Select**: Dropdown select component with options
- **Spinner**: Loading indicator with multiple sizes
- **Table**: Data table component with sortable headers
- **Tabs**: Tab navigation component

### Layout Components (`/layout`)
Application layout components:

- **Header**: Top navigation bar with user profile
- **Sidebar**: Collapsible side navigation menu
- **Layout**: Main layout wrapper combining header and sidebar

### Form Components (`/form`)
Form handling components with React Hook Form integration:

- **Form**: Base form component with Zod schema validation
- **ControlledInput**: Controlled input for React Hook Form
- **ControlledSelect**: Controlled select for React Hook Form
- **ControlledCheckbox**: Controlled checkbox component
- **ControlledRadioGroup**: Controlled radio group component
- **ControlledTextarea**: Controlled textarea component

### Authentication Components (`/auth`)
Authentication-related components:

- **LoginForm**: Complete login form with validation and social login options

## Usage Examples

### Button Component
```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

<Button variant="danger" loading>
  Processing...
</Button>
```

### Form with Validation
```tsx
import { Form, ControlledInput } from '@/components/form/Form';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

<Form schema={schema} onSubmit={handleSubmit}>
  {({ control, formState: { errors } }) => (
    <>
      <ControlledInput
        name="email"
        control={control}
        label="Email"
        type="email"
      />
      <ControlledInput
        name="password"
        control={control}
        label="Password"
        type="password"
      />
      <Button type="submit">Submit</Button>
    </>
  )}
</Form>
```

### Modal Component
```tsx
import { Modal, ConfirmDialog } from '@/components/ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Edit Customer"
  size="lg"
>
  <p>Modal content here</p>
</Modal>

<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Customer?"
  description="This action cannot be undone."
  variant="danger"
/>
```

### Table Component
```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
      <TableCell>
        <Badge variant="success">Active</Badge>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Styling

All components use:
- Tailwind CSS for styling
- CSS variables for theme colors
- `cn()` utility for conditional class names
- Responsive design patterns

## Dependencies

- React 18.2+
- TypeScript 5.0+
- Tailwind CSS 3.3+
- class-variance-authority (for variant styling)
- React Hook Form (for form components)
- Zod (for schema validation)

## Testing

Component tests are located in `__tests__` directories within each component folder. Run tests with:

```bash
npm run test
```

## Contributing

When adding new components:
1. Follow the existing component structure
2. Include TypeScript types
3. Add proper documentation
4. Include usage examples
5. Write unit tests
6. Export from the appropriate index file