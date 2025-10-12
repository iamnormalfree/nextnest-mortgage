# Railway Build Troubleshooting Checklist

Quick reference guide for debugging Railway deployment issues for NextNest application.

## Common Build Errors & Solutions

### Error 1: Cannot access process.env during build

**Symptom:**
```
Error: NEXT_PUBLIC_SUPABASE_URL is undefined
TypeError: Cannot read properties of undefined
```

**Root Cause:** Module-level code accessing environment variables

**Solution:**
1. Convert to lazy initialization pattern
2. Add export const dynamic = 'force-dynamic' to API routes

**Example Fix:**
```typescript
// BEFORE (BROKEN)
export const client = createClient(process.env.API_KEY!);

// AFTER (FIXED)
let _client: Client | null = null;
export function getClient() {
  if (!_client) {
    _client = createClient(process.env.API_KEY!);
  }
  return _client;
}
```

---

### Error 2: Property does not exist on type Window

**Symptom:**
```
Property 'gtag' does not exist on type 'Window'
```

**Root Cause:** External .d.ts files not picked up in Railway build

**Solution:** Add inline type declarations

**Example Fix:**
```typescript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
```

---

### Error 3: Supabase type inference error

**Symptom:**
```
Type 'never' is not assignable to type 'Update'
```

**Root Cause:** Supabase v2.75.0 type inference bug

**Solution:** Use explicit types with @ts-expect-error

**Example Fix:**
```typescript
type MyUpdate = Database['public']['Tables']['my_table']['Update'];
const updateData: MyUpdate = { /* data */ };
// @ts-expect-error - Supabase client bug
await supabase.from('my_table').update(updateData);
```

---

### Error 4: Database column does not exist

**Symptom:**
```
column 'is_available' does not exist
```

**Root Cause:** TypeScript types out of sync with database schema

**Solution:**
1. Create migration in supabase/migrations/
2. Run migration on Supabase
3. Regenerate types in lib/db/types/database.types.ts

---

### Error 5: Docker build fails with npm errors

**Symptom:**
```
npm ERR! peer dependencies
```

**Root Cause:** Incorrect npm install command

**Solution:** Use npm ci instead of npm ci --only=production

**Fix in Dockerfile:**
```dockerfile
RUN npm ci && npm cache clean --force
```

---

### Error 6: Cannot find module 'server.js'

**Symptom:**
```
Error: Cannot find module '/app/server.js'
```

**Root Cause:** Missing standalone output configuration

**Solution:** Add to next.config.js

```javascript
const nextConfig = {
  output: 'standalone',
  // ... rest of config
}
```

---

### Error 7: API route returns 500 at runtime

**Symptom:** Build succeeds, but runtime errors in API routes

**Root Cause:** API route prerendered during build

**Solution:** Force dynamic rendering

```typescript
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Route code...
}
```

---

## Debugging Workflow

### Step 1: Check Railway Logs
```bash
railway logs
railway logs --follow
```

### Step 2: Test Locally
```bash
npm ci
npm run build
npm run start
```

### Step 3: Test Docker Build
```bash
docker build -t test-build .
docker run -p 3000:3000 test-build
```

### Step 4: Verify Environment Variables
```bash
railway variables
```

### Step 5: Check Database Schema
Verify migrations applied in Supabase dashboard

---

## Prevention Checklist

Before pushing to Railway:

- [ ] Run npm run build locally
- [ ] Run npm run lint to catch errors
- [ ] Test Docker build locally
- [ ] Verify all environment variables set in Railway
- [ ] Check database migrations applied
- [ ] Review API routes for dynamic rendering
- [ ] Confirm no module-level service initialization

---

## Quick Fix Commands

### View Logs
```bash
railway logs --follow
```

### Rebuild
```bash
git commit --allow-empty -m 'Trigger rebuild'
git push
```

### Check Status
```bash
railway status
```

### Open Dashboard
```bash
railway open
```

---

## Environment Variables Template

Required environment variables for Railway:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_KEY=eyJxxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# Chatwoot
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=xxx
CHATWOOT_API_URL=https://xxx.chatwoot.com
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=1
CHATWOOT_API_ACCESS_TOKEN=xxx

# Redis
REDIS_URL=redis://xxx

# Application
NEXT_PUBLIC_BASE_URL=https://your-app.up.railway.app
NODE_ENV=production
```

---

## Common Patterns

### Lazy Initialization Pattern
```typescript
let _instance: Service | null = null;

export function getInstance(): Service {
  if (!_instance) {
    _instance = new Service(process.env.API_KEY!);
  }
  return _instance;
}
```

### Dynamic API Route
```typescript
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const data = await fetch(process.env.API_URL);
  return Response.json(data);
}
```

### Inline Type Declaration
```typescript
declare global {
  interface Window {
    myGlobal?: MyType;
  }
}
```

---

## Reference Links

**Project Files:**
- Session Summary: docs/sessions/2025-10-12_railway-deployment-fixes.md
- Dockerfile: Dockerfile
- Next Config: next.config.js
- Supabase Client: lib/db/supabase-client.ts

**Railway CLI:**
- Installation: npm install -g @railway/cli
- Login: railway login
- Link: railway link

---

## Emergency Rollback

If deployment is broken:

```bash
# Check recent commits
git log --oneline -10

# Revert to last working commit
git revert HEAD
git push

# OR reset to specific commit (use with caution)
git reset --hard <commit-sha>
git push --force
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-12  
**Quick Access:** Bookmark this file for fast troubleshooting
