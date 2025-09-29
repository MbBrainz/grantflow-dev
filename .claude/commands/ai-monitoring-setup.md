---
name: ai-monitoring-setup
description: Set up comprehensive monitoring and analytics for AI SDK applications
---

## Set up AI SDK Monitoring and Analytics

Configure comprehensive monitoring and analytics for AI SDK applications: $ARGUMENTS

### Current Monitoring Analysis

Existing monitoring setup: !`grep -r "monitoring\|analytics\|metrics" . --include="*.ts" --include="*.tsx" | head -5`

Performance tracking: !`grep -r "performance\|latency\|duration" . --include="*.ts" | head -5`

Error handling: !`grep -r "error\|catch\|throw" . --include="*.ts" | head -5`

### Monitoring Categories

**Performance**: Latency, throughput, response times, edge performance
**Usage**: Token consumption, request patterns, user behavior
**Costs**: Provider costs, usage optimization, budget tracking
**Errors**: Error rates, failure patterns, recovery metrics
**Analytics**: User insights, feature adoption, performance trends
**Dashboard**: Real-time monitoring, alerts, visualization

### Your Task

1. **Analyze monitoring requirements** for comprehensive AI SDK observability
2. **Implement performance tracking** with latency and throughput metrics
3. **Set up usage analytics** for token consumption and cost tracking
4. **Configure error monitoring** with detailed error classification
5. **Build real-time dashboard** for monitoring AI SDK applications
6. **Add alerting system** for performance and error thresholds
7. **Create analytics reports** for insights and optimization
8. **Integrate with external services** (DataDog, New Relic, etc.)

### Implementation Requirements

#### Performance Monitoring

- Request/response latency tracking
- Streaming performance metrics
- Provider response time monitoring
- Edge runtime performance tracking
- Memory and CPU usage monitoring

#### Usage Analytics

- Token consumption tracking by provider and model
- Request volume and patterns
- User behavior and feature adoption
- Geographic usage distribution
- Time-based usage patterns

#### Cost Management

- Real-time cost calculation across providers
- Budget tracking and alerting
- Cost optimization recommendations
- Provider cost comparison
- Usage forecasting and planning

### Expected Deliverables

1. **Performance monitoring system** with real-time metrics
2. **Usage analytics dashboard** with cost tracking
3. **Error monitoring and alerting** with detailed classification
4. **Custom analytics implementation** for AI SDK specific metrics
5. **Integration setup** for external monitoring services
6. **Real-time dashboard** with visualizations and alerts
7. **Monitoring documentation** with setup and usage guides

### Performance Monitoring Implementation

#### Core Monitoring Infrastructure

```typescript
// lib/monitoring/core.ts
import { performance } from 'perf_hooks'

export interface MetricData {
  name: string
  value: number
  timestamp: number
  tags: Record<string, string>
  metadata?: Record<string, any>
}

export interface PerformanceMetrics {
  latency: number
  tokens: {
    input: number
    output: number
    total: number
  }
  cost: number
  provider: string
  model: string
  success: boolean
  errorType?: string
}

export class AISDKMonitor {
  private static instance: AISDKMonitor
  private metrics: MetricData[] = []
  private performanceData: Map<string, PerformanceMetrics> = new Map()

  static getInstance(): AISDKMonitor {
    if (!AISDKMonitor.instance) {
      AISDKMonitor.instance = new AISDKMonitor()
    }
    return AISDKMonitor.instance
  }

  // Record basic metrics
  recordMetric(name: string, value: number, tags: Record<string, string> = {}) {
    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      tags: {
        ...tags,
        environment: process.env.NODE_ENV || 'development',
        region: process.env.VERCEL_REGION || 'local',
      },
    }

    this.metrics.push(metric)
    this.sendToExternalServices(metric)
  }

  // Record comprehensive performance metrics
  recordPerformance(requestId: string, metrics: PerformanceMetrics) {
    this.performanceData.set(requestId, metrics)

    // Record individual metrics
    this.recordMetric('ai_request_latency', metrics.latency, {
      provider: metrics.provider,
      model: metrics.model,
      success: metrics.success.toString(),
    })

    this.recordMetric('ai_token_usage', metrics.tokens.total, {
      provider: metrics.provider,
      model: metrics.model,
      type: 'total',
    })

    this.recordMetric('ai_request_cost', metrics.cost, {
      provider: metrics.provider,
      model: metrics.model,
    })

    if (!metrics.success && metrics.errorType) {
      this.recordMetric('ai_error_count', 1, {
        provider: metrics.provider,
        model: metrics.model,
        error_type: metrics.errorType,
      })
    }
  }

  // Get performance analytics
  getPerformanceAnalytics(timeRange: { start: Date; end: Date }) {
    const filteredMetrics = this.metrics.filter(
      m =>
        m.timestamp >= timeRange.start.getTime() &&
        m.timestamp <= timeRange.end.getTime()
    )

    return {
      totalRequests: filteredMetrics.filter(
        m => m.name === 'ai_request_latency'
      ).length,
      averageLatency: this.calculateAverage(
        filteredMetrics,
        'ai_request_latency'
      ),
      totalTokens: this.calculateSum(filteredMetrics, 'ai_token_usage'),
      totalCost: this.calculateSum(filteredMetrics, 'ai_request_cost'),
      errorRate: this.calculateErrorRate(filteredMetrics),
      providerBreakdown: this.getProviderBreakdown(filteredMetrics),
    }
  }

  private calculateAverage(metrics: MetricData[], metricName: string): number {
    const relevant = metrics.filter(m => m.name === metricName)
    if (relevant.length === 0) return 0
    return relevant.reduce((sum, m) => sum + m.value, 0) / relevant.length
  }

  private calculateSum(metrics: MetricData[], metricName: string): number {
    return metrics
      .filter(m => m.name === metricName)
      .reduce((sum, m) => sum + m.value, 0)
  }

  private calculateErrorRate(metrics: MetricData[]): number {
    const totalRequests = metrics.filter(
      m => m.name === 'ai_request_latency'
    ).length
    const errors = metrics.filter(m => m.name === 'ai_error_count').length
    return totalRequests > 0 ? errors / totalRequests : 0
  }

  private getProviderBreakdown(metrics: MetricData[]) {
    const providers = new Map<
      string,
      { requests: number; tokens: number; cost: number }
    >()

    metrics.forEach(metric => {
      const provider = metric.tags.provider
      if (!provider) return

      if (!providers.has(provider)) {
        providers.set(provider, { requests: 0, tokens: 0, cost: 0 })
      }

      const data = providers.get(provider)!

      switch (metric.name) {
        case 'ai_request_latency':
          data.requests += 1
          break
        case 'ai_token_usage':
          data.tokens += metric.value
          break
        case 'ai_request_cost':
          data.cost += metric.value
          break
      }
    })

    return Object.fromEntries(providers)
  }

  private sendToExternalServices(metric: MetricData) {
    // Send to various monitoring services
    if (process.env.DATADOG_API_KEY) {
      this.sendToDataDog(metric)
    }

    if (process.env.NEW_RELIC_LICENSE_KEY) {
      this.sendToNewRelic(metric)
    }

    if (process.env.CUSTOM_ANALYTICS_ENDPOINT) {
      this.sendToCustomAnalytics(metric)
    }
  }

  private async sendToDataDog(metric: MetricData) {
    // DataDog implementation
    try {
      const response = await fetch('https://api.datadoghq.com/api/v1/series', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': process.env.DATADOG_API_KEY!,
        },
        body: JSON.stringify({
          series: [
            {
              metric: `aisdk.${metric.name}`,
              points: [[metric.timestamp / 1000, metric.value]],
              tags: Object.entries(metric.tags).map(([k, v]) => `${k}:${v}`),
            },
          ],
        }),
      })

      if (!response.ok) {
        console.error('Failed to send metric to DataDog:', response.statusText)
      }
    } catch (error) {
      console.error('DataDog metric send error:', error)
    }
  }

  private async sendToNewRelic(metric: MetricData) {
    // New Relic implementation
    try {
      const response = await fetch(
        'https://metric-api.newrelic.com/metric/v1',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': process.env.NEW_RELIC_LICENSE_KEY!,
          },
          body: JSON.stringify([
            {
              metrics: [
                {
                  name: `aisdk.${metric.name}`,
                  type: 'gauge',
                  value: metric.value,
                  timestamp: metric.timestamp,
                  attributes: metric.tags,
                },
              ],
            },
          ]),
        }
      )

      if (!response.ok) {
        console.error(
          'Failed to send metric to New Relic:',
          response.statusText
        )
      }
    } catch (error) {
      console.error('New Relic metric send error:', error)
    }
  }

  private async sendToCustomAnalytics(metric: MetricData) {
    // Custom analytics endpoint
    try {
      await fetch(process.env.CUSTOM_ANALYTICS_ENDPOINT!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      })
    } catch (error) {
      console.error('Custom analytics send error:', error)
    }
  }
}

// Singleton instance
export const monitor = AISDKMonitor.getInstance()
```

#### AI SDK Integration Middleware

```typescript
// lib/monitoring/middleware.ts
import { streamText, generateText } from 'ai'
import { monitor, PerformanceMetrics } from './core'
import { calculateCost } from './cost-calculator'

export function withMonitoring<T extends Function>(fn: T, context: string): T {
  return (async (...args: any[]) => {
    const requestId = generateRequestId()
    const startTime = performance.now()

    try {
      const result = await fn(...args)

      // Extract metrics from result
      const endTime = performance.now()
      const latency = endTime - startTime

      const metrics: PerformanceMetrics = {
        latency,
        tokens: extractTokenUsage(result),
        cost: calculateCost(
          extractTokenUsage(result),
          extractModelInfo(result)
        ),
        provider: extractProvider(result) || 'unknown',
        model: extractModel(result) || 'unknown',
        success: true,
      }

      monitor.recordPerformance(requestId, metrics)

      return result
    } catch (error) {
      const endTime = performance.now()
      const latency = endTime - startTime

      const metrics: PerformanceMetrics = {
        latency,
        tokens: { input: 0, output: 0, total: 0 },
        cost: 0,
        provider: 'unknown',
        model: 'unknown',
        success: false,
        errorType: error.constructor.name,
      }

      monitor.recordPerformance(requestId, metrics)

      throw error
    }
  }) as T
}

// Enhanced streaming with monitoring
export const monitoredStreamText = withMonitoring(streamText, 'stream_text')
export const monitoredGenerateText = withMonitoring(
  generateText,
  'generate_text'
)

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function extractTokenUsage(result: any) {
  if (result?.usage) {
    return {
      input: result.usage.promptTokens || 0,
      output: result.usage.completionTokens || 0,
      total: result.usage.totalTokens || 0,
    }
  }
  return { input: 0, output: 0, total: 0 }
}

function extractProvider(result: any): string | null {
  // Extract provider from model configuration
  if (result?.model?._provider) {
    return result.model._provider
  }
  return null
}

function extractModel(result: any): string | null {
  if (result?.model?.modelId) {
    return result.model.modelId
  }
  return null
}

function extractModelInfo(result: any) {
  return {
    provider: extractProvider(result),
    model: extractModel(result),
  }
}
```

#### Cost Calculation System

```typescript
// lib/monitoring/cost-calculator.ts
interface ProviderPricing {
  [model: string]: {
    input: number // Cost per 1K input tokens
    output: number // Cost per 1K output tokens
  }
}

const PROVIDER_PRICING: Record<string, ProviderPricing> = {
  anthropic: {
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
    'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
  },
  openai: {
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'o1-preview': { input: 0.015, output: 0.06 },
    'o1-mini': { input: 0.003, output: 0.012 },
  },
  google: {
    'gemini-pro': { input: 0.0005, output: 0.0015 },
    'gemini-pro-vision': { input: 0.0005, output: 0.0015 },
  },
  cohere: {
    command: { input: 0.0015, output: 0.002 },
    'command-light': { input: 0.0003, output: 0.0006 },
  },
}

export function calculateCost(
  tokens: { input: number; output: number; total: number },
  modelInfo: { provider: string | null; model: string | null }
): number {
  if (!modelInfo.provider || !modelInfo.model) {
    return 0
  }

  const pricing = PROVIDER_PRICING[modelInfo.provider]?.[modelInfo.model]
  if (!pricing) {
    console.warn(`No pricing data for ${modelInfo.provider}:${modelInfo.model}`)
    return 0
  }

  const inputCost = (tokens.input / 1000) * pricing.input
  const outputCost = (tokens.output / 1000) * pricing.output

  return inputCost + outputCost
}

export class CostTracker {
  private static dailyCosts = new Map<string, number>()
  private static monthlyCosts = new Map<string, number>()

  static recordCost(cost: number, provider: string, model: string) {
    const today = new Date().toISOString().split('T')[0]
    const month = today.substring(0, 7)

    // Daily tracking
    const dailyKey = `${today}:${provider}:${model}`
    this.dailyCosts.set(dailyKey, (this.dailyCosts.get(dailyKey) || 0) + cost)

    // Monthly tracking
    const monthlyKey = `${month}:${provider}:${model}`
    this.monthlyCosts.set(
      monthlyKey,
      (this.monthlyCosts.get(monthlyKey) || 0) + cost
    )

    // Check budget alerts
    this.checkBudgetAlerts(cost, provider)
  }

  static getDailyCost(date?: string): number {
    const targetDate = date || new Date().toISOString().split('T')[0]
    let total = 0

    for (const [key, cost] of this.dailyCosts.entries()) {
      if (key.startsWith(targetDate)) {
        total += cost
      }
    }

    return total
  }

  static getMonthlyCost(month?: string): number {
    const targetMonth = month || new Date().toISOString().substring(0, 7)
    let total = 0

    for (const [key, cost] of this.monthlyCosts.entries()) {
      if (key.startsWith(targetMonth)) {
        total += cost
      }
    }

    return total
  }

  static getProviderBreakdown(timeRange: 'daily' | 'monthly' = 'daily') {
    const costs = timeRange === 'daily' ? this.dailyCosts : this.monthlyCosts
    const breakdown = new Map<string, number>()

    for (const [key, cost] of costs.entries()) {
      const provider = key.split(':')[1]
      breakdown.set(provider, (breakdown.get(provider) || 0) + cost)
    }

    return Object.fromEntries(breakdown)
  }

  private static checkBudgetAlerts(cost: number, provider: string) {
    const dailyBudget = parseFloat(process.env.DAILY_AI_BUDGET || '50')
    const monthlyBudget = parseFloat(process.env.MONTHLY_AI_BUDGET || '1000')

    const dailyCost = this.getDailyCost()
    const monthlyCost = this.getMonthlyCost()

    if (dailyCost > dailyBudget * 0.9) {
      this.sendBudgetAlert('daily', dailyCost, dailyBudget)
    }

    if (monthlyCost > monthlyBudget * 0.9) {
      this.sendBudgetAlert('monthly', monthlyCost, monthlyBudget)
    }
  }

  private static sendBudgetAlert(
    period: string,
    current: number,
    budget: number
  ) {
    const alert = {
      type: 'budget_alert',
      period,
      current_cost: current,
      budget,
      utilization: current / budget,
      timestamp: new Date().toISOString(),
    }

    // Send alert (email, Slack, etc.)
    console.warn('BUDGET ALERT:', alert)

    // You could integrate with notification services here
    if (process.env.SLACK_WEBHOOK_URL) {
      this.sendSlackAlert(alert)
    }
  }

  private static async sendSlackAlert(alert: any) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 AI Budget Alert: ${alert.period} spending (${alert.current_cost.toFixed(2)}) is at ${(alert.utilization * 100).toFixed(1)}% of budget ($${alert.budget})`,
        }),
      })
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
    }
  }
}
```

### Real-Time Dashboard Implementation

```typescript
// app/api/monitoring/dashboard/route.ts
export async function GET(req: Request) {
  const monitor = AISDKMonitor.getInstance()
  const { searchParams } = new URL(req.url)
  const timeRange = searchParams.get('range') || '1h'

  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - parseTimeRange(timeRange))

  const analytics = monitor.getPerformanceAnalytics({
    start: startTime,
    end: endTime,
  })
  const costBreakdown = CostTracker.getProviderBreakdown('daily')

  const dashboard = {
    timeRange,
    overview: {
      totalRequests: analytics.totalRequests,
      averageLatency: Math.round(analytics.averageLatency),
      totalTokens: analytics.totalTokens,
      totalCost: analytics.totalCost.toFixed(4),
      errorRate: (analytics.errorRate * 100).toFixed(2) + '%',
    },
    providers: analytics.providerBreakdown,
    costs: {
      daily: CostTracker.getDailyCost().toFixed(4),
      monthly: CostTracker.getMonthlyCost().toFixed(4),
      breakdown: costBreakdown,
    },
    alerts: await getActiveAlerts(),
  }

  return Response.json(dashboard)
}

function parseTimeRange(range: string): number {
  const unit = range.slice(-1)
  const value = parseInt(range.slice(0, -1))

  switch (unit) {
    case 'h':
      return value * 60 * 60 * 1000
    case 'd':
      return value * 24 * 60 * 60 * 1000
    case 'w':
      return value * 7 * 24 * 60 * 60 * 1000
    default:
      return 60 * 60 * 1000 // Default to 1 hour
  }
}

async function getActiveAlerts() {
  // Return active alerts from your alerting system
  return []
}
```

#### React Dashboard Component

```typescript
// components/monitoring-dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface DashboardData {
  overview: {
    totalRequests: number;
    averageLatency: number;
    totalTokens: number;
    totalCost: string;
    errorRate: string;
  };
  providers: Record<string, any>;
  costs: {
    daily: string;
    monthly: string;
    breakdown: Record<string, number>;
  };
}

export default function MonitoringDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [timeRange, setTimeRange] = useState('1h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/monitoring/dashboard?range=${timeRange}`);
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="text-center text-red-500">Failed to load dashboard data</div>;
  }

  const providerColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
  const costBreakdownData = Object.entries(data.costs.breakdown).map(([provider, cost]) => ({
    provider,
    cost: parseFloat(cost.toFixed(4)),
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">AI SDK Monitoring Dashboard</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="1h">Last Hour</option>
          <option value="6h">Last 6 Hours</option>
          <option value="1d">Last Day</option>
          <option value="7d">Last Week</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
          <p className="text-2xl font-bold">{data.overview.totalRequests.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Avg Latency</h3>
          <p className="text-2xl font-bold">{data.overview.averageLatency}ms</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Tokens</h3>
          <p className="text-2xl font-bold">{data.overview.totalTokens.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Cost</h3>
          <p className="text-2xl font-bold">${data.overview.totalCost}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Error Rate</h3>
          <p className="text-2xl font-bold text-red-500">{data.overview.errorRate}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cost Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Cost Breakdown by Provider</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={costBreakdownData}
                dataKey="cost"
                nameKey="provider"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ provider, cost }) => `${provider}: $${cost}`}
              >
                {costBreakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={providerColors[index % providerColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Provider Usage */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Provider Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(data.providers).map(([provider, stats]) => ({
              provider,
              requests: stats.requests,
              tokens: stats.tokens,
            }))}>
              <XAxis dataKey="provider" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="requests" fill="#8884d8" name="Requests" />
              <Bar dataKey="tokens" fill="#82ca9d" name="Tokens (thousands)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Cost Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Daily Cost</p>
            <p className="text-xl font-bold">${data.costs.daily}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Monthly Cost</p>
            <p className="text-xl font-bold">${data.costs.monthly}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Integration with Existing Code

- **API Routes**: Wrap with monitoring middleware automatically
- **Streaming**: Built-in performance tracking for streaming responses
- **Error Handling**: Automatic error classification and reporting
- **Cost Tracking**: Real-time cost calculation across all providers
- **Alerting**: Budget and performance threshold alerting
- **Dashboard**: Real-time monitoring dashboard with visualizations
- **External Services**: Integration with DataDog, New Relic, custom analytics

Focus on building comprehensive monitoring that provides actionable insights for AI SDK applications while maintaining low overhead and high accuracy.
