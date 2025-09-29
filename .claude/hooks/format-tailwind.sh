#!/bin/bash

# Format and sort Tailwind classes after file modifications
# This hook runs after Write/Edit/MultiEdit operations

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

# Only process TypeScript/JavaScript files
if [[ ! "$FILE_PATH" =~ \.(tsx?|jsx?)$ ]]; then
  echo "$TOOL_RESULT"
  exit 0
fi

# Check if file exists and we can process it
if [ -f "$FILE_PATH" ]; then
  # Check for prettier and format if available
  if command -v npx &> /dev/null && [ -f "package.json" ]; then
    # Check if prettier is installed
    if npm list prettier &>/dev/null || npm list -g prettier &>/dev/null; then
      echo "🎨 Formatting $FILE_PATH with Prettier..." >&2
      npx prettier --write "$FILE_PATH" 2>/dev/null
    fi
    
    # Check if prettier-plugin-tailwindcss is available for class sorting
    if npm list prettier-plugin-tailwindcss &>/dev/null; then
      echo "🎨 Sorting Tailwind classes in $FILE_PATH..." >&2
      npx prettier --write "$FILE_PATH" --plugin=prettier-plugin-tailwindcss 2>/dev/null
    fi
  fi
  
  # Additional validation for shadcn components
  if [[ "$FILE_PATH" =~ components/ui/ ]] || [[ "$FILE_PATH" =~ src/components/ui/ ]]; then
    # Count Tailwind classes (rough estimate)
    CLASS_COUNT=$(grep -o 'className=' "$FILE_PATH" | wc -l)
    CN_COUNT=$(grep -o 'cn(' "$FILE_PATH" | wc -l)
    
    if [ $CLASS_COUNT -gt 0 ] && [ $CN_COUNT -eq 0 ]; then
      echo "💡 Tip: Consider using the cn() utility for className merging in $FILE_PATH" >&2
    fi
    
    # Check for common Tailwind mistakes
    if grep -q 'className="[^"]*  [^"]*"' "$FILE_PATH"; then
      echo "⚠️  Warning: Double spaces detected in className attributes" >&2
    fi
    
    # Check for responsive modifiers in correct order
    if grep -qE 'className="[^"]*(lg:|xl:|2xl:)[^"]*(sm:|md:)' "$FILE_PATH"; then
      echo "⚠️  Warning: Responsive modifiers should be in mobile-first order (sm → md → lg → xl)" >&2
    fi
    
    # Check for dark mode classes
    if grep -q 'dark:' "$FILE_PATH"; then
      echo "✓ Dark mode classes detected - ensure CSS variables are used for consistency" >&2
    fi
    
    # Count CVA usage
    if grep -q 'cva(' "$FILE_PATH"; then
      echo "✓ CVA variants detected - good for component flexibility" >&2
    fi
  fi
fi

# Pass through the original result
echo "$TOOL_RESULT"
exit 0