#!/bin/bash

# Validate shadcn/ui component structure before changes
# This hook runs before Write/Edit/MultiEdit operations

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Read tool input from stdin
TOOL_INPUT=$(cat)
TOOL_NAME=$(echo "$TOOL_INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.tool_input.file_path // empty')

# Only validate component files
if [[ ! "$FILE_PATH" =~ components/ui/.*\.tsx$ ]] && [[ ! "$FILE_PATH" =~ src/components/ui/.*\.tsx$ ]]; then
  echo "$TOOL_INPUT"
  exit 0
fi

# Extract component name from file path
COMPONENT_NAME=$(basename "$FILE_PATH" .tsx)

# Validation flags
HAS_ERRORS=0
WARNINGS=""

# Function to log warnings
log_warning() {
  WARNINGS="${WARNINGS}⚠️  $1\n"
}

# Function to log errors
log_error() {
  echo -e "${RED}❌ Component Validation Error: $1${NC}" >&2
  HAS_ERRORS=1
}

# Check if this is a Write operation for a new file
if [ "$TOOL_NAME" = "Write" ] && [ ! -f "$FILE_PATH" ]; then
  # New component file - check for required patterns in content
  CONTENT=$(echo "$TOOL_INPUT" | jq -r '.tool_input.content // empty')
  
  # Check for forwardRef pattern
  if [[ ! "$CONTENT" =~ "React.forwardRef" ]] && [[ ! "$CONTENT" =~ "forwardRef" ]]; then
    log_warning "New component should use React.forwardRef for ref forwarding"
  fi
  
  # Check for displayName
  if [[ ! "$CONTENT" =~ "displayName" ]]; then
    log_warning "Component should have displayName for debugging"
  fi
  
  # Check for TypeScript types
  if [[ ! "$CONTENT" =~ "interface.*Props" ]] && [[ ! "$CONTENT" =~ "type.*Props" ]]; then
    log_warning "Component should have TypeScript prop types defined"
  fi
  
  # Check for cn utility usage
  if [[ "$CONTENT" =~ "className" ]] && [[ ! "$CONTENT" =~ "cn(" ]]; then
    log_warning "Consider using cn() utility for className merging"
  fi
  
  # Check for accessibility attributes in interactive components
  if [[ "$CONTENT" =~ "<button" ]] || [[ "$CONTENT" =~ "<a " ]] || [[ "$CONTENT" =~ "<input" ]]; then
    if [[ ! "$CONTENT" =~ "aria-" ]] && [[ ! "$CONTENT" =~ "role=" ]]; then
      log_warning "Interactive components should include ARIA attributes for accessibility"
    fi
  fi
fi

# Check for Edit operations on existing files
if [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "MultiEdit" ]; then
  # Check if removing important patterns
  OLD_STRING=$(echo "$TOOL_INPUT" | jq -r '.tool_input.old_string // empty')
  NEW_STRING=$(echo "$TOOL_INPUT" | jq -r '.tool_input.new_string // empty')
  
  # Check if removing forwardRef
  if [[ "$OLD_STRING" =~ "forwardRef" ]] && [[ ! "$NEW_STRING" =~ "forwardRef" ]]; then
    log_warning "Removing forwardRef might break ref forwarding"
  fi
  
  # Check if removing displayName
  if [[ "$OLD_STRING" =~ "displayName" ]] && [[ ! "$NEW_STRING" =~ "displayName" ]]; then
    log_warning "Removing displayName will make debugging harder"
  fi
  
  # Check if removing TypeScript types
  if [[ "$OLD_STRING" =~ ": React.FC" ]] || [[ "$OLD_STRING" =~ ": FC" ]]; then
    if [[ ! "$NEW_STRING" =~ ": React.FC" ]] && [[ ! "$NEW_STRING" =~ ": FC" ]]; then
      log_warning "Consider maintaining TypeScript types for components"
    fi
  fi
fi

# Special validation for specific component types
case "$COMPONENT_NAME" in
  button|input|select|textarea)
    if [ "$TOOL_NAME" = "Write" ]; then
      CONTENT=$(echo "$TOOL_INPUT" | jq -r '.tool_input.content // empty')
      if [[ ! "$CONTENT" =~ "disabled" ]]; then
        log_warning "Form components should handle disabled state"
      fi
    fi
    ;;
  dialog|modal|sheet|alert-dialog)
    if [ "$TOOL_NAME" = "Write" ]; then
      CONTENT=$(echo "$TOOL_INPUT" | jq -r '.tool_input.content // empty')
      if [[ ! "$CONTENT" =~ "onOpenChange" ]] && [[ ! "$CONTENT" =~ "open" ]]; then
        log_warning "Overlay components should have open/onOpenChange props"
      fi
    fi
    ;;
esac

# If there are errors, block the operation
if [ $HAS_ERRORS -eq 1 ]; then
  exit 2
fi

# If there are warnings, show them but allow operation
if [ -n "$WARNINGS" ]; then
  echo -e "${YELLOW}Component Validation Warnings:${NC}" >&2
  echo -e "$WARNINGS" >&2
fi

# Pass through the original input
echo "$TOOL_INPUT"
exit 0