---
name: ai-chat-setup
description: Set up a complete AI chat interface with streaming
---

## Set up AI Chat Interface

Create a production-ready chat interface with the Vercel AI SDK based on the specified type: $ARGUMENTS

### Project Context

Current project structure: !`find . -type f -name "*.json" -o -name "*.ts" -o -name "*.tsx" | head -10`

Current dependencies: !`cat package.json | jq '.dependencies // {}' 2>/dev/null || echo "No package.json found"`

### Requirements Analysis

Based on the requested chat type ($ARGUMENTS), I'll implement:

**Basic Chat**: Simple text-based streaming chat interface
**Advanced Chat**: Enhanced UI with message history, error handling, and optimizations  
**Multimodal Chat**: Support for images, PDFs, and file uploads
**RAG Chat**: Retrieval-augmented generation with knowledge base
**Agent Chat**: Tool-calling agents with function execution

### Your Task

1. **Analyze the current project structure** to understand the existing setup
2. **Install required dependencies** if not already present
3. **Create the appropriate chat implementation** based on the specified type
4. **Set up the API route** with proper streaming and error handling
5. **Implement the React component** with modern UI patterns
6. **Add proper TypeScript types** for type safety
7. **Include error boundaries** and loading states
8. **Test the implementation** and provide usage instructions

### Implementation Guidelines

- Use the latest AI SDK patterns and best practices
- Implement proper error handling and loading states
- Add TypeScript types for all interfaces
- Follow Next.js App Router conventions
- Include proper accessibility features
- Use modern React patterns (hooks, Suspense, etc.)
- Add responsive design considerations
- Implement proper security measures

### Expected Deliverables

1. API route handler (`app/api/chat/route.ts`)
2. Chat component (`components/chat.tsx` or similar)
3. Required TypeScript types
4. Updated package.json dependencies
5. Basic styling (Tailwind classes)
6. Usage documentation and examples

Focus on creating a robust, production-ready implementation that follows AI SDK best practices and modern web development standards.
