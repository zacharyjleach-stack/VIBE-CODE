Add shadcn/ui components to this project.

Components or feature to add: $ARGUMENTS

**Initial setup (if not configured):**
```bash
npx shadcn@latest init
```
Choose: New York style, Zinc base color, CSS variables: yes

**Adding components:**
```bash
npx shadcn@latest add button card dialog input form table tabs
```

**Key patterns:**

*Forms with react-hook-form + zod:*
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
```

*Dialogs/Modals:*
```tsx
<Dialog>
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

*Data Tables with @tanstack/react-table:*
- Use the DataTable component pattern from shadcn docs
- Add sorting, filtering, pagination

*Theming:*
- Customize in globals.css CSS variables
- Match to existing project theme (dark mode)

Install the specific components needed and wire them up with proper state management.
