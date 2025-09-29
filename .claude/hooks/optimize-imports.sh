#!/bin/bash

# Optimize and clean up imports when session ends
# This hook runs on Stop event

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Running import optimization...${NC}" >&2

# Find all TypeScript/JavaScript files in components directory
COMPONENT_FILES=$(find . -path "*/components/*.tsx" -o -path "*/components/*.ts" -o -path "*/components/*.jsx" -o -path "*/components/*.js" 2>/dev/null)

if [ -z "$COMPONENT_FILES" ]; then
  echo -e "${YELLOW}No component files found to optimize${NC}" >&2
  exit 0
fi

# Count total files
TOTAL_FILES=$(echo "$COMPONENT_FILES" | wc -l)
OPTIMIZED=0

echo -e "${BLUE}Checking $TOTAL_FILES component files...${NC}" >&2

# Process each file
while IFS= read -r FILE; do
  if [ ! -f "$FILE" ]; then
    continue
  fi
  
  CHANGES_MADE=false
  
  # Check for unused imports (basic check)
  # This is a simple heuristic - a proper tool like ESLint would be better
  IMPORTS=$(grep -E "^import .* from" "$FILE" 2>/dev/null)
  
  while IFS= read -r IMPORT_LINE; do
    # Extract imported names (basic regex, doesn't handle all cases)
    if [[ "$IMPORT_LINE" =~ import[[:space:]]+\{([^}]+)\} ]]; then
      NAMES="${BASH_REMATCH[1]}"
      # Check each imported name
      IFS=',' read -ra NAME_ARRAY <<< "$NAMES"
      for NAME in "${NAME_ARRAY[@]}"; do
        # Clean up the name (remove spaces and 'as' aliases)
        CLEAN_NAME=$(echo "$NAME" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | cut -d' ' -f1)
        # Check if the name is used in the file (excluding the import line)
        if ! grep -q "$CLEAN_NAME" "$FILE" | grep -v "^import"; then
          echo -e "${YELLOW}  ⚠️  Potentially unused import '$CLEAN_NAME' in $FILE${NC}" >&2
        fi
      done
    fi
  done <<< "$IMPORTS"
  
  # Check import order (should be external -> internal -> relative)
  IMPORT_BLOCK=$(awk '/^import/,/^[^i]/' "$FILE" | grep "^import" 2>/dev/null)
  
  # Categories
  REACT_IMPORTS=""
  EXTERNAL_IMPORTS=""
  INTERNAL_IMPORTS=""
  RELATIVE_IMPORTS=""
  UI_IMPORTS=""
  
  while IFS= read -r LINE; do
    if [[ "$LINE" =~ from[[:space:]]+[\'\"]react ]]; then
      REACT_IMPORTS="$REACT_IMPORTS$LINE\n"
    elif [[ "$LINE" =~ from[[:space:]]+[\'\"]@/components/ui ]]; then
      UI_IMPORTS="$UI_IMPORTS$LINE\n"
    elif [[ "$LINE" =~ from[[:space:]]+[\'\"]@/ ]]; then
      INTERNAL_IMPORTS="$INTERNAL_IMPORTS$LINE\n"
    elif [[ "$LINE" =~ from[[:space:]]+[\'\"]\.\.?/ ]]; then
      RELATIVE_IMPORTS="$RELATIVE_IMPORTS$LINE\n"
    else
      EXTERNAL_IMPORTS="$EXTERNAL_IMPORTS$LINE\n"
    fi
  done <<< "$IMPORT_BLOCK"
  
  # Check for duplicate imports from same module
  MODULES=$(echo "$IMPORT_BLOCK" | grep -oE "from ['\"][^'\"]+['\"]" | sort | uniq -d)
  if [ -n "$MODULES" ]; then
    echo -e "${YELLOW}  ⚠️  Duplicate imports detected in $FILE${NC}" >&2
    echo "$MODULES" | while read -r MODULE; do
      echo -e "${YELLOW}      $MODULE${NC}" >&2
    done
  fi
  
  # Check for specific shadcn/ui optimizations
  if [[ "$FILE" =~ components/ui/ ]]; then
    # Check if using barrel imports when individual imports would be better
    if grep -q "from '@/components/ui'" "$FILE"; then
      echo -e "${YELLOW}  💡 Tip: Import UI components directly (e.g., from '@/components/ui/button')${NC}" >&2
    fi
    
    # Check for missing cn utility import when className is used
    if grep -q "className=" "$FILE" && ! grep -q "import.*cn.*from" "$FILE"; then
      if grep -q "clsx\|classnames" "$FILE"; then
        echo -e "${YELLOW}  💡 Consider using cn() utility from '@/lib/utils' instead of clsx/classnames${NC}" >&2
      fi
    fi
  fi
  
  ((OPTIMIZED++))
done <<< "$COMPONENT_FILES"

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" >&2
echo -e "${GREEN}✅ Import optimization check complete!${NC}" >&2
echo -e "${BLUE}   Files checked: $OPTIMIZED/$TOTAL_FILES${NC}" >&2

# Additional recommendations
if command -v npx &> /dev/null && [ -f "package.json" ]; then
  echo -e "${BLUE}💡 For automatic import optimization, consider:${NC}" >&2
  echo -e "${BLUE}   • ESLint with eslint-plugin-import${NC}" >&2
  echo -e "${BLUE}   • prettier-plugin-organize-imports${NC}" >&2
  echo -e "${BLUE}   • TypeScript's organizeImports feature${NC}" >&2
fi

exit 0