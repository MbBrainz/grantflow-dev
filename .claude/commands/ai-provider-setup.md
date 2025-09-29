---
name: ai-provider-setup
description: Configure AI providers and multi-provider setup
---

## Set up AI Provider Configuration

Configure robust AI provider setup with the Vercel AI SDK: $ARGUMENTS

### Current Configuration Analysis

Existing provider setup: !`grep -r "@ai-sdk/" . --include="*.ts" --include="*.tsx" | head -5`

Environment variables: !`grep -r "API_KEY\|_KEY" .env* 2>/dev/null | head -5 || echo "No API keys found in .env files"`

Provider imports: !`grep -r "from '@ai-sdk/" . --include="*.ts" | head -10`

### Configuration Strategy

**Single Provider**: Focus on one provider with optimal configuration
**Multi Provider**: Set up multiple providers with consistent interface
**Fallback**: Implement automatic failover between providers

### Your Task

1. **Analyze current provider setup** and identify improvements needed
2. **Design provider architecture** with proper abstraction layers
3. **Implement configuration management** with environment handling
4. **Set up provider fallback logic** for reliability
5. **Add usage tracking and cost monitoring** for optimization
6. **Create provider health checks** for monitoring
7. **Implement proper error handling** and recovery
8. **Add comprehensive testing** for all providers

### Implementation Requirements

#### Environment Configuration

- Secure API key management
- Environment-specific configurations
- Provider availability detection
- Default provider selection
- Feature flag support for provider switching

#### Provider Abstraction

- Unified interface across all providers
- Model capability mapping
- Feature detection and adaptation
- Consistent error handling
- Performance monitoring integration

#### Fallback and Reliability

- Automatic provider failover
- Health check implementation
- Circuit breaker patterns
- Retry logic with exponential backoff
- Graceful degradation strategies

### Expected Deliverables

1. **Provider configuration system** with environment management
2. **Multi-provider client wrapper** with unified interface
3. **Fallback and health monitoring** implementation
4. **Usage tracking and analytics** system
5. **Cost optimization utilities** for model selection
6. **Testing suite** covering all provider scenarios
7. **Documentation** with setup guides and best practices

### Provider-Specific Optimizations

#### Anthropic Configuration

- Claude model selection (Haiku, Sonnet, Opus, Claude 4)
- Extended thinking capabilities setup
- Prompt caching configuration
- Tool use optimization
- Context window management

#### OpenAI Configuration

- Model selection (GPT-3.5, GPT-4, GPT-4o, O1)
- Responses API integration
- Function calling optimization
- Structured output configuration
- Built-in tool integration (web search)

#### Google Configuration

- Gemini model variants setup
- Search grounding capabilities
- Multimodal processing optimization
- Safety settings configuration
- Thinking mode integration

#### Cohere Configuration

- Command model setup
- RAG optimization
- Embedding integration
- Multilingual support
- Custom model fine-tuning

### Cost Management

#### Usage Tracking

- Token usage monitoring across providers
- Cost calculation and reporting
- Budget limits and alerting
- Usage pattern analysis
- Optimization recommendations

#### Model Selection

- Intelligent model routing based on task complexity
- Cost-performance optimization
- Usage-based provider selection
- Dynamic model switching
- A/B testing for provider performance

### Security and Compliance

#### API Key Management

- Secure key storage and rotation
- Environment variable validation
- Access control and permissions
- Audit logging for API usage
- Compliance reporting

#### Data Privacy

- Request/response logging controls
- Data retention policies
- Regional data handling
- Privacy-preserving configurations
- Compliance monitoring

### Monitoring and Observability

#### Health Monitoring

- Provider availability checks
- Latency and performance monitoring
- Error rate tracking
- Success rate analysis
- Capacity utilization monitoring

#### Analytics and Reporting

- Usage dashboards and reports
- Cost analysis and forecasting
- Performance benchmarking
- User behavior analysis
- Provider comparison metrics

### Testing Strategy

- Provider connectivity tests
- Failover scenario testing
- Performance and load testing
- Cost calculation validation
- Security and compliance testing
- Integration testing with applications

Focus on building a robust, cost-effective, and reliable multi-provider architecture that ensures high availability and optimal performance while maintaining security and compliance standards.
