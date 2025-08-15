# UI Component Library

A shared React component library built with [shadcn/ui](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/), designed to provide consistent, accessible, and beautiful UI components across all apps in the monorepo.

## 🎯 Purpose

This package serves as the **single source of truth** for all UI components in the internal tools monorepo, ensuring:

- **Consistency**: All apps use the same design system and components
- **Maintainability**: Component updates are centralized and automatically available everywhere
- **Developer Experience**: Pre-built, tested components that work out of the box
- **Accessibility**: Built-in accessibility features following ARIA guidelines
- **Performance**: Optimized components with minimal bundle impact

## 📦 Installation & Usage

### **Adding Components to Your App**

```bash
cd apps/your-app
pnpm dlx shadcn@latest add <component-name>
```

**Example:**
```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add form
```

### **Importing Components**

```tsx
import { Button } from "@workspace/ui/components/button"
import { Card, CardHeader, CardTitle, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
```

### **Basic Usage Examples**

#### **Button Component**
```tsx
import { Button } from "@workspace/ui/components/button"

export function MyComponent() {
  return (
    <div className="space-x-4">
      <Button variant="default">Default Button</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link Style</Button>
    </div>
  )
}
```



## 🔧 Development


### **Component Structure**
```
src/
├── components/          # All UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── styles/             # Global CSS and Tailwind config
```


## 📦 Package Information

- **Location**: `packages/ui/`
- **Import Path**: `@workspace/ui/components/<component-name>`
- **Dependencies**: React, Tailwind CSS, Radix UI primitives
- **Build Output**: Components are consumed directly from source (no build step needed)

---
