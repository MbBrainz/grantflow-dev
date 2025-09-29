---
name: ai-streaming-setup
description: Set up streaming AI responses with proper error handling
---

## Set up AI Streaming Implementation

Create a robust streaming AI implementation with the Vercel AI SDK for: $ARGUMENTS

### Current Project Analysis

Project structure: !`find . -type f -name "*.ts" -o -name "*.tsx" | grep -E "(api|components|lib)" | head -10`

Existing AI SDK setup: !`grep -r "from 'ai'" . --include="*.ts" --include="*.tsx" | head -5`

Package dependencies: !`cat package.json | jq '.dependencies | to_entries[] | select(.key | contains("ai")) | "\(.key): \(.value)"' -r 2>/dev/null || echo "No AI dependencies found"`

### Streaming Type Analysis

**Text Streaming**: Real-time text generation with token-by-token updates
**Object Streaming**: Structured data streaming with partial object updates  
**Chat Streaming**: Conversational interfaces with message history
**Completion Streaming**: Single-turn completions with progressive updates

### Your Task

1. **Assess current streaming setup** and identify gaps
2. **Implement the appropriate streaming pattern** based on the specified type
3. **Create robust error handling** for stream interruptions and failures
4. **Add proper loading states** and user feedback
5. **Implement stream cancellation** for better UX
6. **Set up proper TypeScript types** for streaming responses
7. **Add performance optimizations** (chunking, backpressure handling)
8. **Include comprehensive testing** for edge cases

### Implementation Requirements

#### Server-Side Streaming

- Proper route handler setup with `maxDuration`
- Model configuration with appropriate parameters
- Stream response formatting with `toUIMessageStreamResponse()` or `toTextStreamResponse()`
- Abort signal handling for stream cancellation
- Error boundaries and fallback responses

#### Client-Side Streaming

- React hooks for stream management (`useChat`, `useCompletion`, `useObject`)
- Progressive UI updates with optimistic rendering
- Loading states and stream status indicators
- Error handling with retry mechanisms
- Stream interruption and cancellation

#### Performance Considerations

- Appropriate chunk sizing for smooth updates
- Memory management for long streams
- Connection pooling and reuse
- Backpressure handling for slow consumers
- Optimization for mobile and slow connections

### Expected Deliverables

1. **Streaming API route** with proper configuration
2. **React streaming component** with modern patterns
3. **TypeScript interfaces** for streaming data
4. **Error handling implementation** with recovery
5. **Performance optimizations** for production
6. **Testing suite** for streaming functionality
7. **Documentation** with usage examples

### Testing Requirements

- Stream start and completion scenarios
- Network interruption and recovery
- Concurrent stream handling
- Error conditions and fallbacks
- Performance under load
- Mobile and slow connection testing

Focus on building a production-ready streaming implementation that provides excellent user experience with proper error handling and performance optimization.
