# 🗄️ LLM INSIGHTS DATABASE & BACKEND REQUIREMENTS
**Complete Infrastructure for Real-time Bank Insights System**
**Date: February 9, 2025**

---

## 🏗️ DATABASE ARCHITECTURE

### **1. Primary Database (PostgreSQL/Supabase)**
```sql
-- Main bank packages table
CREATE TABLE bank_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_name VARCHAR(100) NOT NULL,
  package_name VARCHAR(200) NOT NULL,
  package_code VARCHAR(50) UNIQUE NOT NULL,
  
  -- Loan parameters
  loan_type VARCHAR(20) CHECK (loan_type IN ('new_purchase', 'refinance', 'both')),
  category VARCHAR(20) CHECK (category IN ('fixed', 'floating', 'hybrid')),
  loan_quantum_min DECIMAL(10,2),
  loan_quantum_max DECIMAL(10,2),
  
  -- Property eligibility
  property_types TEXT[], -- Array of eligible types
  occupancy_type VARCHAR(20),
  
  -- Interest rates
  rate_year_1 DECIMAL(5,3),
  rate_year_2 DECIMAL(5,3),
  rate_year_3 DECIMAL(5,3),
  rate_year_4 DECIMAL(5,3),
  rate_year_5 DECIMAL(5,3),
  rate_thereafter DECIMAL(5,3),
  
  -- SORA specific
  sora_spread DECIMAL(5,3),
  sora_floor DECIMAL(5,3),
  
  -- Features
  lock_in_years INTEGER DEFAULT 0,
  lock_in_penalty TEXT,
  clawback_years INTEGER DEFAULT 0,
  legal_subsidy DECIMAL(10,2),
  valuation_subsidy BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_verified TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  INDEX idx_bank_name (bank_name),
  INDEX idx_loan_type (loan_type),
  INDEX idx_property_types (property_types),
  INDEX idx_is_active (is_active),
  INDEX idx_updated_at (updated_at)
);

-- Historical rate snapshots for trend analysis
CREATE TABLE rate_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date DATE NOT NULL,
  property_type VARCHAR(50) NOT NULL,
  
  -- Aggregated metrics
  avg_rate DECIMAL(5,3),
  median_rate DECIMAL(5,3),
  min_rate DECIMAL(5,3),
  max_rate DECIMAL(5,3),
  package_count INTEGER,
  
  -- Category breakdown
  fixed_avg_rate DECIMAL(5,3),
  fixed_count INTEGER,
  floating_avg_rate DECIMAL(5,3),
  floating_count INTEGER,
  
  -- Market indicators
  sora_rate DECIMAL(5,3),
  fed_rate DECIMAL(5,3),
  
  -- Change tracking
  packages_added INTEGER DEFAULT 0,
  packages_removed INTEGER DEFAULT 0,
  rates_increased INTEGER DEFAULT 0,
  rates_decreased INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint for one snapshot per day per property type
  UNIQUE(snapshot_date, property_type),
  INDEX idx_snapshot_date (snapshot_date DESC),
  INDEX idx_property_type (property_type)
);

-- Generated insights cache
CREATE TABLE insights_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_key VARCHAR(200) UNIQUE NOT NULL, -- e.g., "market_pulse_hdb_2025-02-09"
  insight_type VARCHAR(50) NOT NULL,
  property_type VARCHAR(50),
  
  -- Insight content
  content JSONB NOT NULL,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  source_data_hash VARCHAR(64), -- SHA-256 of source data
  llm_model VARCHAR(50),
  prompt_version VARCHAR(20),
  
  -- Performance metrics
  generation_time_ms INTEGER,
  token_count INTEGER,
  
  INDEX idx_insight_key (insight_key),
  INDEX idx_expires_at (expires_at),
  INDEX idx_insight_type (insight_type)
);

-- Audit log for all operations
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  
  -- Event details
  action VARCHAR(100),
  changes JSONB,
  metadata JSONB,
  
  -- Context
  user_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_event_type (event_type),
  INDEX idx_entity_type (entity_type),
  INDEX idx_created_at (created_at DESC)
);

-- SORA rate history
CREATE TABLE sora_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rate_date DATE UNIQUE NOT NULL,
  
  -- SORA rates
  sora_1m DECIMAL(5,3),
  sora_3m DECIMAL(5,3),
  sora_6m DECIMAL(5,3),
  compounded_sora DECIMAL(5,3),
  
  -- Market context
  fed_rate DECIMAL(5,3),
  sibor_1m DECIMAL(5,3),
  sibor_3m DECIMAL(5,3),
  
  source VARCHAR(50) DEFAULT 'MAS',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_rate_date (rate_date DESC)
);
```

### **2. Time-Series Database (TimescaleDB Extension)**
```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create hypertable for high-frequency rate tracking
CREATE TABLE rate_ticks (
  time TIMESTAMPTZ NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  package_code VARCHAR(50) NOT NULL,
  rate DECIMAL(5,3),
  rate_type VARCHAR(20),
  
  PRIMARY KEY (time, bank_name, package_code)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('rate_ticks', 'time');

-- Create continuous aggregate for hourly averages
CREATE MATERIALIZED VIEW rate_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS hour,
  bank_name,
  AVG(rate) as avg_rate,
  MIN(rate) as min_rate,
  MAX(rate) as max_rate,
  COUNT(*) as tick_count
FROM rate_ticks
GROUP BY hour, bank_name;

-- Add retention policy (keep 90 days of detailed data)
SELECT add_retention_policy('rate_ticks', INTERVAL '90 days');
```

### **3. Cache Layer (Redis)**
```javascript
// Redis key structure
const redisSchema = {
  // Real-time insights
  "insights:market:hdb": {
    ttl: 86400, // 24 hours
    data: {
      avgRate: "2.65-2.95%",
      trend: "rising",
      lastUpdated: "2025-02-09T09:05:00Z"
    }
  },
  
  // User session calculations
  "calc:session:{sessionId}": {
    ttl: 3600, // 1 hour
    data: {
      propertyType: "HDB",
      loanAmount: 750000,
      insights: []
    }
  },
  
  // Rate limits
  "ratelimit:api:{clientId}": {
    ttl: 60,
    count: 0,
    max: 100
  },
  
  // LLM response cache
  "llm:response:{promptHash}": {
    ttl: 3600,
    response: {},
    tokenCount: 0
  }
}
```

---

## 🔧 BACKEND PROCESSING ARCHITECTURE

### **1. Data Ingestion Pipeline**
```typescript
// n8n Workflow or Node.js Cron Job
interface DataIngestionPipeline {
  schedule: "0 9 * * *", // 9:00 AM daily
  
  steps: [
    {
      name: "FetchSoraRate",
      endpoint: "https://api.mas.gov.sg/sora/latest",
      handler: async () => {
        const soraData = await fetchMasApi();
        await db.sora_rates.insert(soraData);
        return soraData;
      }
    },
    {
      name: "SyncBankPackages", 
      source: "Airtable",
      handler: async () => {
        const packages = await airtable.base('Bank_Packages').select().all();
        const updates = await syncPackagesToDb(packages);
        await logAudit('SYNC_PACKAGES', updates);
        return updates;
      }
    },
    {
      name: "DetectChanges",
      handler: async () => {
        const changes = await detectPackageChanges();
        if (changes.length > 0) {
          await notifyChanges(changes);
        }
        return changes;
      }
    },
    {
      name: "CreateSnapshot",
      handler: async () => {
        const snapshot = await generateDailySnapshot();
        await db.rate_snapshots.insert(snapshot);
        return snapshot;
      }
    }
  ]
}
```

### **2. LLM Processing Service**
```typescript
// LLM Insight Generation Service
class InsightGenerationService {
  private llmClient: OpenAI | Anthropic;
  private db: PostgresClient;
  private cache: RedisClient;
  
  async generateDailyInsights(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 1. Fetch current data
      const packages = await this.db.query(`
        SELECT * FROM bank_packages 
        WHERE is_active = true
      `);
      
      // 2. Fetch historical data for trends
      const history = await this.db.query(`
        SELECT * FROM rate_snapshots 
        WHERE snapshot_date >= CURRENT_DATE - INTERVAL '90 days'
        ORDER BY snapshot_date DESC
      `);
      
      // 3. Generate insights by property type
      const propertyTypes = ['HDB', 'EC', 'Private', 'Landed'];
      
      for (const propertyType of propertyTypes) {
        const prompt = this.buildMarketAnalysisPrompt(
          propertyType, 
          packages, 
          history
        );
        
        const insight = await this.llmClient.chat.completions.create({
          model: 'gpt-4-turbo',
          messages: [{ role: 'system', content: prompt }],
          temperature: 0.3,
          response_format: { type: "json_object" }
        });
        
        // 4. Validate and store insight
        const validated = this.validateInsight(insight);
        
        await this.storeInsight(propertyType, validated);
        
        // 5. Update cache
        await this.cache.set(
          `insights:market:${propertyType.toLowerCase()}`,
          validated,
          86400 // 24 hour TTL
        );
      }
      
      // 6. Log success
      await this.logAudit({
        event_type: 'INSIGHTS_GENERATED',
        duration_ms: Date.now() - startTime,
        property_types: propertyTypes
      });
      
    } catch (error) {
      await this.handleError(error);
      throw error;
    }
  }
  
  private buildMarketAnalysisPrompt(
    propertyType: string,
    packages: BankPackage[],
    history: RateSnapshot[]
  ): string {
    const currentAvg = this.calculateAverage(packages, propertyType);
    const weekAgo = history.find(h => 
      h.property_type === propertyType && 
      h.snapshot_date === this.getDateDaysAgo(7)
    );
    
    return `
      You are analyzing Singapore mortgage packages for ${propertyType}.
      
      Current Data:
      - ${packages.length} active packages
      - Average rate: ${currentAvg}%
      - SORA: ${history[0].sora_rate}%
      
      Historical Context:
      - 7 days ago: ${weekAgo?.avg_rate}%
      - 30 days ago: ${history[30]?.avg_rate}%
      
      Generate market insights following these rules:
      1. Calculate trend (rising/stable/falling)
      2. Identify best category (fixed/floating)
      3. Note popular features
      4. NO bank names in output
      
      Return JSON format:
      {
        "averageRate": "X.XX-Y.YY%",
        "trend": "rising|stable|falling",
        "trendContext": "brief explanation",
        "bestCategory": "fixed|floating",
        "topFeature": "description",
        "confidence": 0-100
      }
    `;
  }
}
```

### **3. API Service Layer**
```typescript
// FastAPI or Express.js API
class InsightAPIService {
  
  @RateLimit(100, '1m') // 100 requests per minute
  @Cache(300) // Cache for 5 minutes
  async getMarketInsight(propertyType: string): Promise<MarketInsight> {
    // Check cache first
    const cached = await this.cache.get(`insights:market:${propertyType}`);
    if (cached) {
      return cached;
    }
    
    // Fetch from database
    const insight = await this.db.insights_cache.findOne({
      insight_key: `market_pulse_${propertyType}_${today()}`,
      expires_at: { $gt: new Date() }
    });
    
    if (!insight) {
      // Fallback to static insight
      return this.getStaticFallback(propertyType);
    }
    
    // Update cache
    await this.cache.set(`insights:market:${propertyType}`, insight.content);
    
    return insight.content;
  }
  
  @RateLimit(50, '1m')
  async getRefinanceAnalysis(
    currentRate: number,
    outstandingLoan: number,
    currentBank: string
  ): Promise<RefinanceInsight> {
    // Real-time calculation
    const eligiblePackages = await this.db.query(`
      SELECT * FROM bank_packages
      WHERE is_active = true
        AND loan_type IN ('refinance', 'both')
        AND loan_quantum_min <= $1
        AND loan_quantum_max >= $1
        AND bank_name != $2
    `, [outstandingLoan, currentBank]);
    
    const bestRate = Math.min(...eligiblePackages.map(p => p.rate_year_1));
    const savings = this.calculateMonthlySavings(
      outstandingLoan,
      currentRate,
      bestRate
    );
    
    return {
      bestAvailableRate: `${bestRate}-${bestRate + 0.3}%`,
      monthlySavings: savings,
      packageCount: eligiblePackages.length,
      confidence: this.calculateConfidence(eligiblePackages)
    };
  }
}
```

---

## 📊 LOGGING & MONITORING

### **1. Structured Logging (Winston/Pino)**
```typescript
// Logging configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'llm-insights' },
  transports: [
    // Write to files
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    }),
    
    // Stream to CloudWatch/Datadog
    new WinstonCloudWatch({
      logGroupName: 'nextnest-llm-insights',
      logStreamName: `${process.env.NODE_ENV}-${Date.now()}`,
      awsRegion: 'ap-southeast-1'
    })
  ]
});

// Log categories
interface LogCategories {
  DATA_INGESTION: {
    packages_synced: number,
    duration_ms: number,
    source: string
  },
  
  LLM_GENERATION: {
    prompt_tokens: number,
    completion_tokens: number,
    cost_usd: number,
    model: string
  },
  
  API_REQUEST: {
    endpoint: string,
    method: string,
    status: number,
    duration_ms: number,
    user_id?: string
  },
  
  CACHE_OPERATION: {
    operation: 'hit' | 'miss' | 'set' | 'delete',
    key: string,
    ttl?: number
  },
  
  ERROR: {
    error_type: string,
    message: string,
    stack: string,
    context: object
  }
}
```

### **2. Metrics Collection (Prometheus)**
```typescript
// Metrics definitions
const metrics = {
  // Counters
  insights_generated_total: new Counter({
    name: 'insights_generated_total',
    help: 'Total insights generated',
    labelNames: ['type', 'property_type']
  }),
  
  api_requests_total: new Counter({
    name: 'api_requests_total',
    help: 'Total API requests',
    labelNames: ['endpoint', 'method', 'status']
  }),
  
  // Gauges
  active_packages_count: new Gauge({
    name: 'active_packages_count',
    help: 'Number of active bank packages',
    labelNames: ['bank', 'type']
  }),
  
  cache_size_bytes: new Gauge({
    name: 'cache_size_bytes',
    help: 'Current cache size in bytes'
  }),
  
  // Histograms
  llm_generation_duration: new Histogram({
    name: 'llm_generation_duration_seconds',
    help: 'LLM insight generation duration',
    labelNames: ['model', 'insight_type'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),
  
  api_response_time: new Histogram({
    name: 'api_response_time_seconds',
    help: 'API response time',
    labelNames: ['endpoint'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1]
  })
};
```

### **3. Health Checks**
```typescript
// Health check endpoints
class HealthCheckService {
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkLLMService(),
      this.checkDataFreshness()
    ]);
    
    return {
      status: checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'degraded',
      checks: {
        database: checks[0],
        cache: checks[1],
        llm: checks[2],
        data_freshness: checks[3]
      },
      timestamp: new Date().toISOString()
    };
  }
  
  private async checkDataFreshness(): Promise<boolean> {
    const latestSnapshot = await this.db.query(`
      SELECT MAX(snapshot_date) as latest 
      FROM rate_snapshots
    `);
    
    const hoursSinceUpdate = 
      (Date.now() - latestSnapshot.latest) / (1000 * 60 * 60);
    
    return hoursSinceUpdate < 25; // Alert if >25 hours old
  }
}
```

---

## 🚀 DEPLOYMENT REQUIREMENTS

### **1. Infrastructure**
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: timescale/timescaledb:latest-pg14
    environment:
      POSTGRES_DB: nextnest_insights
      POSTGRES_USER: insights_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    
  api:
    build: ./backend
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis
    ports:
      - "8000:8000"
    
  cron:
    build: ./cron
    environment:
      DATABASE_URL: ${DATABASE_URL}
      AIRTABLE_API_KEY: ${AIRTABLE_API_KEY}
    depends_on:
      - postgres
      - api

volumes:
  postgres_data:
  redis_data:
```

### **2. Environment Variables**
```bash
# .env
# Database
DATABASE_URL=postgresql://insights_user:password@localhost:5432/nextnest_insights
REDIS_URL=redis://localhost:6379

# External APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AIRTABLE_API_KEY=key...
MAS_API_KEY=...

# Application
NODE_ENV=production
API_PORT=8000
LOG_LEVEL=info

# Monitoring
DATADOG_API_KEY=...
SENTRY_DSN=...

# Security
JWT_SECRET=...
ENCRYPTION_KEY=...
```

### **3. Backup Strategy**
```bash
# Automated backup script
#!/bin/bash

# Daily database backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz
aws s3 cp backup_$(date +%Y%m%d).sql.gz s3://nextnest-backups/

# Keep 30 days of backups
aws s3 ls s3://nextnest-backups/ | while read -r line; do
  createDate=$(echo $line | awk {'print $1" "$2'})
  createDate=$(date -d "$createDate" +%s)
  olderThan=$(date -d "30 days ago" +%s)
  if [[ $createDate -lt $olderThan ]]; then
    fileName=$(echo $line | awk {'print $4'})
    aws s3 rm s3://nextnest-backups/$fileName
  fi
done
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 1: Database Setup (Week 1)**
- [ ] Provision PostgreSQL with TimescaleDB
- [ ] Create all tables and indexes
- [ ] Setup Redis cache
- [ ] Configure automated backups
- [ ] Import initial bank packages data

### **Phase 2: Backend Services (Week 2)**
- [ ] Implement data ingestion pipeline
- [ ] Setup LLM integration service
- [ ] Create API endpoints
- [ ] Implement caching layer
- [ ] Add rate limiting

### **Phase 3: Monitoring (Week 3)**
- [ ] Configure structured logging
- [ ] Setup Prometheus metrics
- [ ] Create Grafana dashboards
- [ ] Implement health checks
- [ ] Setup alerting rules

### **Phase 4: Production (Week 4)**
- [ ] Deploy to cloud infrastructure
- [ ] Configure CI/CD pipeline
- [ ] Load testing
- [ ] Security audit
- [ ] Documentation

---

## 🔒 SECURITY CONSIDERATIONS

### **Data Protection**
- Encrypt sensitive data at rest (AES-256)
- Use TLS 1.3 for all API communications
- Implement field-level encryption for PII
- Regular security audits

### **Access Control**
- API key rotation every 30 days
- Role-based access control (RBAC)
- IP whitelisting for admin endpoints
- Multi-factor authentication for admin access

### **Compliance**
- PDPA compliant data handling
- MAS regulatory compliance
- Regular compliance audits
- Data retention policies

---

**END OF REQUIREMENTS DOCUMENT**