#!/bin/bash

# Check accessibility compliance after component modifications
# This hook runs after Write/Edit/MultiEdit operations

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Read tool result from stdin
TOOL_RESULT=$(cat)
TOOL_NAME=$(echo "$TOOL_RESULT" | jq -r '.tool_name // empty' 2>/dev/null)

# Only process if it's a file modification tool
if [[ "$TOOL_NAME" != "Write" ]] && [[ "$TOOL_NAME" != "Edit" ]] && [[ "$TOOL_NAME" != "MultiEdit" ]]; then
  echo "$TOOL_RESULT"
  exit 0
fi

# Extract file path
FILE_PATH=$(echo "$TOOL_RESULT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Only process component files
if [[ ! "$FILE_PATH" =~ \.(tsx?|jsx?)$ ]] || [[ ! "$FILE_PATH" =~ component ]]; then
  echo "$TOOL_RESULT"
  exit 0
fi

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
  echo "$TOOL_RESULT"
  exit 0
fi

echo -e "${BLUE}🔍 Checking accessibility in $FILE_PATH...${NC}" >&2

# Initialize counters
ISSUES=0
WARNINGS=0

# Function to check patterns
check_pattern() {
  local pattern="$1"
  local message="$2"
  local type="$3" # "error" or "warning"
  
  if grep -q "$pattern" "$FILE_PATH"; then
    if [ "$type" = "error" ]; then
      echo -e "${RED}❌ A11y Issue: $message${NC}" >&2
      ((ISSUES++))
    else
      echo -e "${YELLOW}⚠️  A11y Warning: $message${NC}" >&2
      ((WARNINGS++))
    fi
    return 1
  fi
  return 0
}

# Function to check for missing patterns
check_missing() {
  local pattern="$1"
  local context="$2"
  local message="$3"
  
  if grep -q "$context" "$FILE_PATH"; then
    if ! grep -q "$pattern" "$FILE_PATH"; then
      echo -e "${YELLOW}⚠️  A11y Warning: $message${NC}" >&2
      ((WARNINGS++))
      return 1
    fi
  fi
  return 0
}

# Check for interactive elements without keyboard support
if grep -qE '<(button|a|input|select|textarea)' "$FILE_PATH"; then
  # Check for onClick without onKeyDown/onKeyPress
  if grep -q 'onClick=' "$FILE_PATH"; then
    if ! grep -qE '(onKeyDown|onKeyPress|onKeyUp)=' "$FILE_PATH"; then
      echo -e "${YELLOW}⚠️  A11y Warning: onClick handlers should have keyboard alternatives${NC}" >&2
      ((WARNINGS++))
    fi
  fi
  
  # Check for proper button usage
  if grep -q '<div.*onClick=' "$FILE_PATH"; then
    echo -e "${YELLOW}⚠️  A11y Warning: Use <button> instead of <div> with onClick for interactive elements${NC}" >&2
    ((WARNINGS++))
  fi
fi

# Check for images without alt text
if grep -qE '<img[^>]*>' "$FILE_PATH"; then
  IMG_TAGS=$(grep -o '<img[^>]*>' "$FILE_PATH")
  while IFS= read -r img; do
    if ! echo "$img" | grep -q 'alt='; then
      echo -e "${RED}❌ A11y Issue: Image missing alt attribute${NC}" >&2
      ((ISSUES++))
    fi
  done <<< "$IMG_TAGS"
fi

# Check for form elements
if grep -qE '<(input|select|textarea)' "$FILE_PATH"; then
  # Check for labels
  check_missing "label" "input\|select\|textarea" "Form elements should have associated labels"
  
  # Check for aria-required on required fields
  if grep -q 'required' "$FILE_PATH"; then
    check_missing "aria-required" "required" "Required fields should have aria-required attribute"
  fi
  
  # Check for error messages
  if grep -q 'error' "$FILE_PATH"; then
    check_missing "aria-describedby\|aria-errormessage" "error" "Error messages should be associated with form fields"
  fi
fi

# Check for ARIA attributes
if grep -q '<button' "$FILE_PATH"; then
  # Icon-only buttons should have aria-label
  if grep -qE '<button[^>]*>[\s]*<(svg|Icon)' "$FILE_PATH"; then
    check_missing "aria-label" "<button.*Icon\|<button.*svg" "Icon-only buttons need aria-label"
  fi
fi

# Check for modals/dialogs
if grep -qE '(Dialog|Modal|Sheet|Popover)' "$FILE_PATH"; then
  check_missing "aria-labelledby\|aria-label" "Dialog\|Modal" "Dialogs should have aria-labelledby or aria-label"
  check_missing "aria-describedby" "DialogDescription" "Dialogs should have aria-describedby for descriptions"
fi

# Check for proper heading hierarchy
if grep -qE '<h[1-6]' "$FILE_PATH"; then
  # Extract all heading levels
  HEADINGS=$(grep -o '<h[1-6]' "$FILE_PATH" | sed 's/<h//' | sort -n)
  PREV=0
  for h in $HEADINGS; do
    if [ $PREV -ne 0 ] && [ $((h - PREV)) -gt 1 ]; then
      echo -e "${YELLOW}⚠️  A11y Warning: Heading hierarchy skip detected (h$PREV to h$h)${NC}" >&2
      ((WARNINGS++))
      break
    fi
    PREV=$h
  done
fi

# Check for color contrast (basic check for hardcoded colors)
if grep -qE '(text-(white|black)|bg-(white|black))' "$FILE_PATH"; then
  if grep -q 'text-white.*bg-white\|text-black.*bg-black' "$FILE_PATH"; then
    echo -e "${RED}❌ A11y Issue: Potential color contrast issue detected${NC}" >&2
    ((ISSUES++))
  fi
fi

# Check for focus management
if grep -qE '(focus:outline-none|outline-none)' "$FILE_PATH"; then
  if ! grep -q 'focus-visible:\|focus:ring\|focus:border' "$FILE_PATH"; then
    echo -e "${RED}❌ A11y Issue: Removing outline without providing alternative focus indicator${NC}" >&2
    ((ISSUES++))
  fi
fi

# Check for live regions
if grep -q 'toast\|notification\|alert\|message' "$FILE_PATH"; then
  check_missing "aria-live\|role=\"alert\"\|role=\"status\"" "toast\|notification\|alert" "Dynamic content should use live regions"
fi

# Check for lists
if grep -qE '<li[^>]*>' "$FILE_PATH"; then
  if ! grep -qE '<(ul|ol)[^>]*>' "$FILE_PATH"; then
    echo -e "${YELLOW}⚠️  A11y Warning: <li> elements should be wrapped in <ul> or <ol>${NC}" >&2
    ((WARNINGS++))
  fi
fi

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" >&2
if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ Accessibility check passed!${NC}" >&2
else
  if [ $ISSUES -gt 0 ]; then
    echo -e "${RED}Found $ISSUES accessibility issues${NC}" >&2
  fi
  if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Found $WARNINGS accessibility warnings${NC}" >&2
  fi
  echo -e "${BLUE}Consider running a full accessibility audit with axe-core${NC}" >&2
fi

# Pass through the original result
echo "$TOOL_RESULT"
exit 0