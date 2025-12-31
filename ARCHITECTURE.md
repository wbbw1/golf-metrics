# Golf Metrics Dashboard - System Architecture

## Overview
A composable, extensible CEO dashboard for tracking key business metrics with support for AI-powered analytics and easy addition of new data sources.

## Core Principles
1. **Composability**: Easy to add new data sources without touching core logic
2. **Extensibility**: Built-in hooks for AI/analytics features
3. **Separation of Concerns**: Clear boundaries between layers
4. **Real-time with Caching**: Fresh data with historical snapshots
5. **Type Safety**: Full TypeScript throughout

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │ Dashboard  │  │   Charts   │  │  Refresh Controls   │   │
│  │   Cards    │  │ Components │  │  & Manual Triggers  │   │
│  └────────────┘  └────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Metric Aggregation Service              │   │
│  │  • Transform raw data → unified metrics              │   │
│  │  • Calculate deltas & trends                         │   │
│  │  • Future: AI Analysis Endpoint                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA PROVIDER LAYER                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │  Finta   │ │  Attio   │ │   GA4    │ │ Phantombuster│   │
│  │ Provider │ │ Provider │ │ Provider │ │   Provider   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│  ┌──────────┐ ┌──────────────────────────────────────┐     │
│  │  Notion  │ │    Provider Registry (Plugin System) │     │
│  │ Provider │ │    • Easy registration of new sources│     │
│  └──────────┘ └──────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   ORCHESTRATION LAYER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Data Fetch Orchestrator                   │   │
│  │  • Manages fetch intervals per provider             │   │
│  │  • Handles parallel fetching                        │   │
│  │  • Retry logic & error handling                     │   │
│  │  • Cache invalidation strategies                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     PERSISTENCE LAYER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Supabase (PostgreSQL)                   │   │
│  │                                                      │   │
│  │  Tables:                                             │   │
│  │  • metrics_snapshots (time-series data)             │   │
│  │  • providers_config (API configs & intervals)       │   │
│  │  • fetch_logs (audit trail)                         │   │
│  │  • ai_insights (future: AI-generated insights)      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Initial Page Load
```
User loads dashboard
  → Check if today's snapshot exists
  → If NO: Trigger fetch orchestrator
  → If YES: Load from cache
  → Display metrics + yesterday's comparison
```

### 2. Manual Refresh
```
User clicks "Refresh All"
  → Trigger all providers
  → Fetch in parallel (respect rate limits)
  → Store new snapshot with timestamp
  → Update UI
```

### 3. Scheduled Background Fetches
```
Vercel Cron Jobs (different intervals per source)
  ├── Every 1 hour: GA4 (website traffic)
  ├── Every 4 hours: Attio (deals don't change that often)
  ├── Every 6 hours: Phantombuster (campaign data)
  ├── Daily: Finta (financial data)
  └── Manual/Daily: Notion (manual entry anyway)
```

---

## Provider Interface (Composability)

All data providers implement a standard interface:

```typescript
interface DataProvider {
  // Unique identifier
  id: string;

  // Human-readable name
  name: string;

  // How often to fetch (in minutes)
  fetchInterval: number;

  // Fetch fresh data from external API
  fetch(): Promise<ProviderMetrics>;

  // Transform API response to standard format
  transform(rawData: any): ProviderMetrics;

  // Validate credentials/config
  validateConfig(): Promise<boolean>;

  // Optional: Support for webhooks
  supportsWebhooks?: boolean;
  webhookHandler?(payload: any): ProviderMetrics;
}

interface ProviderMetrics {
  providerId: string;
  timestamp: Date;
  metrics: Record<string, MetricValue>;
  metadata?: Record<string, any>;
}

interface MetricValue {
  value: number | string;
  type: 'currency' | 'count' | 'percentage' | 'duration' | 'text';
  label: string;
  change?: number; // vs previous period
}
```

### Adding a New Provider

```typescript
// Example: Adding Slack metrics
class SlackProvider implements DataProvider {
  id = 'slack';
  name = 'Slack';
  fetchInterval = 120; // 2 hours

  async fetch() {
    const response = await slackAPI.getStats();
    return this.transform(response);
  }

  transform(rawData: any): ProviderMetrics {
    return {
      providerId: this.id,
      timestamp: new Date(),
      metrics: {
        activeUsers: {
          value: rawData.active_users,
          type: 'count',
          label: 'Active Users Today'
        },
        messagesSent: {
          value: rawData.messages_sent,
          type: 'count',
          label: 'Messages Sent'
        }
      }
    };
  }

  async validateConfig() {
    return await slackAPI.testAuth();
  }
}

// Register it
providerRegistry.register(new SlackProvider());
```

---

## Database Schema

### `providers_config`
```sql
CREATE TABLE providers_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  fetch_interval_minutes INT NOT NULL,
  api_credentials JSONB, -- encrypted
  last_fetch_at TIMESTAMP,
  next_fetch_at TIMESTAMP,
  config JSONB, -- provider-specific config
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `metrics_snapshots`
```sql
CREATE TABLE metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id VARCHAR(50) NOT NULL,
  snapshot_date DATE NOT NULL,
  snapshot_time TIMESTAMP NOT NULL,
  metrics JSONB NOT NULL, -- flexible schema for different metric types
  raw_data JSONB, -- store original API response for debugging
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(provider_id, snapshot_date, snapshot_time)
);

-- Indexes for fast queries
CREATE INDEX idx_snapshots_provider_date ON metrics_snapshots(provider_id, snapshot_date DESC);
CREATE INDEX idx_snapshots_date ON metrics_snapshots(snapshot_date DESC);
```

### `fetch_logs`
```sql
CREATE TABLE fetch_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id VARCHAR(50) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status VARCHAR(20) NOT NULL, -- 'success', 'failure', 'partial'
  error_message TEXT,
  duration_ms INT,
  records_fetched INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `ai_insights` (Future)
```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_date DATE NOT NULL,
  insight_type VARCHAR(50), -- 'anomaly', 'trend', 'recommendation'
  title VARCHAR(200) NOT NULL,
  description TEXT,
  confidence_score FLOAT,
  related_metrics JSONB, -- which metrics triggered this
  is_acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Routes Structure

```
/api
  /auth
    /login                    POST   - Simple auth
    /logout                   POST

  /providers
    /list                     GET    - All configured providers
    /[providerId]/config      GET    - Provider config
    /[providerId]/config      PUT    - Update provider config
    /[providerId]/fetch       POST   - Trigger manual fetch
    /[providerId]/validate    POST   - Test credentials

  /metrics
    /current                  GET    - Latest snapshot (all providers)
    /current?provider=attio   GET    - Latest for specific provider
    /history                  GET    - Historical data
    /history?days=7           GET    - Last N days
    /refresh-all              POST   - Trigger all providers

  /analytics (Future)
    /insights                 GET    - AI-generated insights
    /trends                   GET    - Trend analysis
    /anomalies                GET    - Anomaly detection

  /cron
    /fetch-scheduled          POST   - Vercel cron job endpoint
```

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts or Chart.js
- **State Management**: React Context + SWR (for data fetching)
- **UI Components**: shadcn/ui (for cards, buttons, etc.)

### Backend
- **API**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma (type-safe DB queries)
- **Cron Jobs**: Vercel Cron
- **Validation**: Zod (runtime type checking)

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase
- **Secrets**: Vercel Environment Variables
- **Monitoring**: Vercel Analytics + Custom error logging

---

## AI/Analytics Extension Points

### Phase 1 (Current): Data Collection
- Store raw metrics
- Basic calculations (deltas, trends)

### Phase 2 (Future): AI Layer
```typescript
interface AIAnalysisService {
  // Detect anomalies in metrics
  detectAnomalies(metrics: MetricSnapshot[]): Anomaly[];

  // Generate daily insights
  generateDailyInsights(todayMetrics: MetricSnapshot[]): Insight[];

  // Predictive analytics
  predictNextWeek(historicalData: MetricSnapshot[]): Prediction[];

  // Natural language queries
  askQuestion(question: string, context: MetricSnapshot[]): Answer;
}
```

### Integration Options:
1. **OpenAI API**: For NLP and insights generation
2. **Custom ML Models**: For specific predictions
3. **LangChain**: For RAG-based Q&A over metrics
4. **Agent Framework**: For autonomous analysis

---

## Refresh Strategy

### Smart Caching
```typescript
interface RefreshStrategy {
  // Should we fetch new data?
  shouldRefresh(provider: DataProvider): boolean;

  // What's the cache key?
  getCacheKey(provider: DataProvider, date: Date): string;

  // Cache invalidation rules
  invalidateCache(provider: DataProvider): void;
}
```

### Rules:
1. **First load of day**: Always fetch
2. **Subsequent loads same day**: Use cache unless manual refresh
3. **Stale threshold**: If last fetch > provider.fetchInterval, auto-refresh
4. **Manual override**: "Refresh All" button bypasses all caching

---

## Error Handling

### Provider Failure Strategy
```typescript
1. Retry with exponential backoff (3 attempts)
2. If still failing, serve stale data + show warning
3. Log error to fetch_logs
4. Continue with other providers (don't block dashboard)
5. Optional: Send alert email/Slack if critical provider down
```

### Partial Data Display
- Dashboard shows whatever data is available
- Failed providers show: "Last updated: X hours ago"
- User can manually retry individual providers

---

## Security Considerations

1. **API Credentials**: Encrypted in DB, never exposed to client
2. **Authentication**: Simple password for MVP, can upgrade to OAuth
3. **Rate Limiting**: Respect external API limits
4. **CORS**: Locked to your domain
5. **Environment Variables**: All secrets in Vercel env vars

---

## Deployment Strategy

### Environment Setup
```
Development:  localhost:3000
Staging:      golf-metrics-staging.vercel.app
Production:   golf-metrics.vercel.app (or custom domain)
```

### CI/CD
1. Push to GitHub
2. Vercel auto-deploys
3. Run migrations on Supabase
4. Verify cron jobs are scheduled

---

## Next Steps (Implementation Order)

1. ✅ Research APIs
2. 🔄 Review & approve architecture (YOU ARE HERE)
3. Set up project structure
4. Implement provider interface & registry
5. Build first provider (Attio - has API confirmed)
6. Set up database schema
7. Create basic dashboard UI
8. Add remaining providers
9. Implement caching & refresh logic
10. Add charts & visualizations
11. Deploy to Vercel
12. Set up cron jobs

---

## Future Enhancements

- [ ] AI-powered daily summaries
- [ ] Anomaly detection alerts
- [ ] Natural language queries ("What's my burn rate trend?")
- [ ] Mobile app (React Native)
- [ ] Export to PDF reports
- [ ] Team collaboration (multi-user)
- [ ] Custom metric formulas
- [ ] Integration marketplace (let others add providers)
- [ ] Webhook support for real-time updates
