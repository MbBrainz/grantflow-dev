---
name: setup-form
description: Set up a form with React Hook Form and Zod validation
---

Create a complete form setup with React Hook Form, Zod validation, and shadcn/ui form components.

## Instructions

1. Install required dependencies if not present:
   - `react-hook-form`
   - `@hookform/resolvers`
   - `zod`
   - Required shadcn components: `form`, `input`, `button`, etc.

2. Create the form with:
   - Zod schema for validation
   - Form component with React Hook Form
   - Proper error handling
   - Loading states
   - Success feedback

## Template Structure

```tsx
// lib/validations/[form-name].ts
import * as z from "zod"

export const [formName]Schema = z.object({
  // Define fields
})

export type [FormName]Values = z.infer<typeof [formName]Schema>

// components/forms/[form-name]-form.tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { [formName]Schema, type [FormName]Values } from "@/lib/validations/[form-name]"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

export function [FormName]Form() {
  const form = useForm<[FormName]Values>({
    resolver: zodResolver([formName]Schema),
    defaultValues: {
      // Set defaults
    },
  })

  async function onSubmit(data: [FormName]Values) {
    try {
      // Handle submission
      toast({
        title: "Success",
        description: "Form submitted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Form fields */}
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Form>
  )
}
```

## Common Form Types

- **contact-form**: Name, email, message
- **login-form**: Email/username, password
- **register-form**: Name, email, password, confirm password
- **profile-form**: Avatar, bio, social links
- **settings-form**: Preferences, notifications
- **checkout-form**: Billing, shipping, payment

## Field Types to Consider

- Text inputs (email, url, tel, password)
- Textareas for long text
- Select dropdowns
- Radio groups
- Checkboxes
- Date pickers
- File uploads
- Number inputs with validation

## Example

If the user says: `/setup-form contact`

1. Install dependencies:

```bash
npm install react-hook-form @hookform/resolvers zod
npx shadcn@latest add form input textarea button
```

2. Create validation schema
3. Create form component with name, email, message fields
4. Add proper validation rules
5. Include submit handler with loading state
