---
name: analyze-accessibility
description: Run accessibility audit on components
---

Analyze components for accessibility issues and provide recommendations.

## Instructions

1. If no path specified, analyze all components in `components/ui/`
2. Check for common accessibility issues
3. Verify WCAG 2.1 AA compliance
4. Provide specific recommendations for fixes
5. Generate accessibility report

## Checks to Perform

### HTML Semantics

- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Semantic HTML elements used appropriately
- [ ] Lists use ul/ol with li elements
- [ ] Buttons vs links used correctly

### ARIA Implementation

- [ ] Required ARIA attributes present
- [ ] ARIA roles used appropriately
- [ ] aria-label or aria-labelledby for interactive elements
- [ ] aria-describedby for additional context
- [ ] Live regions for dynamic content

### Keyboard Navigation

- [ ] All interactive elements keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Escape key closes modals/popups
- [ ] Arrow keys work in menus/lists

### Forms

- [ ] All inputs have associated labels
- [ ] Required fields marked with aria-required
- [ ] Error messages associated with inputs
- [ ] Form validation accessible

### Images & Media

- [ ] Images have alt text
- [ ] Decorative images have empty alt=""
- [ ] Videos have captions/transcripts
- [ ] Audio has transcripts

### Color & Contrast

- [ ] Text contrast ratio ≥ 4.5:1 (normal text)
- [ ] Text contrast ratio ≥ 3:1 (large text)
- [ ] Focus indicators have sufficient contrast
- [ ] Information not conveyed by color alone

### Motion & Animation

- [ ] Respects prefers-reduced-motion
- [ ] Animations can be paused/stopped
- [ ] No flashing content (seizure risk)

## Automated Testing

Install and run automated tools:

```bash
# Install testing dependencies
npm install -D @axe-core/react jest-axe

# Run axe-core tests
npx axe <url>

# Use React Testing Library
npm test -- --coverage
```

## Manual Testing Checklist

1. **Keyboard Only Navigation**
   - Disconnect mouse
   - Navigate using Tab, Shift+Tab, Enter, Space, Arrows, Escape
   - Verify all features accessible

2. **Screen Reader Testing**
   - NVDA (Windows)
   - JAWS (Windows)
   - VoiceOver (macOS: Cmd+F5)
   - Verify content makes sense when read aloud

3. **Browser Extensions**
   - axe DevTools
   - WAVE (WebAIM)
   - Lighthouse (Chrome DevTools)

4. **Visual Testing**
   - 200% zoom level
   - High contrast mode
   - Grayscale mode
   - Disable CSS

## Report Format

```markdown
# Accessibility Audit Report

## Summary

- Components analyzed: X
- Critical issues: X
- Warnings: X
- Passed checks: X

## Critical Issues

1. **[Component]**: [Issue description]
   - Impact: [High/Medium/Low]
   - Fix: [Specific recommendation]

## Warnings

1. **[Component]**: [Warning description]
   - Recommendation: [Improvement suggestion]

## Passed Checks

- ✓ Keyboard navigation working
- ✓ ARIA attributes present
- ✓ Color contrast sufficient

## Recommendations

1. Immediate fixes needed for...
2. Consider improving...
3. Best practices to adopt...
```

## Common Fixes

### Missing Labels

```tsx
// ❌ Bad
<input type="text" />

// ✅ Good
<label htmlFor="email">Email</label>
<input id="email" type="text" />
```

### Focus Management

```tsx
// Add focus trap for modals
import { FocusTrap } from '@radix-ui/react-focus-trap'

;<FocusTrap>
  <DialogContent>...</DialogContent>
</FocusTrap>
```

### Screen Reader Announcements

```tsx
// Live region for dynamic content
<div role="status" aria-live="polite" aria-atomic="true">
  {message}
</div>
```

## Example

If the user says: `/analyze-accessibility`

1. Scan all components in components/ui/
2. Check each component against accessibility checklist
3. Run automated tests if available
4. Generate detailed report with:
   - Issues found
   - Specific fixes needed
   - Code examples
   - Priority levels
