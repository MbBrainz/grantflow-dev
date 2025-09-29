---
name: ai-tools-setup
description: Create AI tools and function calling capabilities
---

## Set up AI Tools and Function Calling

Create comprehensive AI tool integrations with the Vercel AI SDK for: $ARGUMENTS

### Current Project Analysis

Existing tool implementations: !`grep -r "import.*tool" . --include="*.ts" --include="*.tsx" | head -5`

API integrations: !`grep -r "fetch\|axios" . --include="*.ts" | head -5`

Database setup: !`find . -name "*schema*" -o -name "*db*" -o -name "*database*" | grep -v node_modules | head -5`

### Tool Type Requirements

**Simple Tools**: Basic utility functions (calculator, formatter, validator)
**Database Tools**: Safe database queries, data retrieval, analytics
**API Tools**: External service integrations, webhooks, data fetching
**Multimodal Tools**: Image processing, document analysis, file handling
**Agent Tools**: Complex workflows, multi-step operations, decision making

### Your Task

1. **Analyze the project needs** and identify appropriate tool types
2. **Design tool schemas** with proper Zod validation
3. **Implement secure execution logic** with error handling
4. **Set up proper authentication** and authorization
5. **Add comprehensive input validation** and sanitization
6. **Implement rate limiting** and usage monitoring
7. **Create tool testing suite** for reliability
8. **Document tool usage** and examples

### Implementation Guidelines

#### Tool Definition Patterns

```typescript
// Basic tool structure
const toolName = tool({
  description: 'Clear description of what the tool does',
  inputSchema: z.object({
    param: z.string().describe('Parameter description'),
  }),
  execute: async ({ param }) => {
    // Implementation with proper error handling
    try {
      const result = await performOperation(param)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
})
```

#### Security Considerations

- Input validation and sanitization
- Authentication and authorization checks
- Rate limiting and abuse prevention
- Secure API key management
- Output filtering and validation
- Audit logging for sensitive operations

#### Error Handling

- Graceful failure modes
- Informative error messages
- Retry mechanisms for transient failures
- Fallback strategies
- Circuit breaker patterns
- Monitoring and alerting

### Expected Deliverables

1. **Tool definitions** with proper schemas and validation
2. **Execution implementations** with robust error handling
3. **Agent integration** with multi-step capabilities
4. **Security middleware** for authentication and rate limiting
5. **Testing suite** covering all tool scenarios
6. **Usage analytics** and monitoring
7. **Documentation** with examples and best practices

### Tool Categories to Implement

#### Data & Analytics Tools

- Database query execution
- Data aggregation and analysis
- Report generation
- Chart and visualization creation

#### External Integration Tools

- REST API clients
- Webhook handlers
- File processing and storage
- Email and notification services

#### Utility Tools

- Text processing and formatting
- Mathematical calculations
- Data validation and transformation
- Code generation and analysis

#### Advanced Agent Tools

- Multi-step workflow orchestration
- Decision tree navigation
- Dynamic tool selection
- Context-aware processing

### Testing Requirements

- Unit tests for each tool execution path
- Integration tests with external services
- Security tests for input validation
- Performance tests under load
- Error scenario testing
- End-to-end agent workflow tests

### Monitoring and Observability

- Tool usage metrics and analytics
- Performance monitoring and latency tracking
- Error rate monitoring and alerting
- Cost tracking for external API usage
- Security audit logging
- User behavior analysis

Focus on building secure, reliable, and well-tested tool integrations that enhance AI capabilities while maintaining proper security and monitoring practices.
