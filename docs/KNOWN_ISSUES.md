# Known Issues & Workarounds

This document tracks current known issues and their workarounds in the NextNest codebase.

## TypeScript Compilation

### Supabase Type Issues
**Issue**: Some Supabase client operations require `as any` type assertions due to incomplete type generation

**Workaround**: Use type assertions where necessary:
```typescript
const result = (await supabase.from('table').select()) as any
```

**Status**: Ongoing - waiting for improved Supabase type generation

### Global Window Types
**Issue**: Multiple declaration conflicts for window types across different files

**Workaround**: Consolidated all global window types in `types/global.d.ts`

**Status**: Resolved - centralized type declarations

### React Hook Dependencies
**Issue**: ESLint warnings for `useEffect` dependencies in some components

**Workaround**: These warnings are non-critical and can be safely ignored or suppressed with `// eslint-disable-next-line react-hooks/exhaustive-deps`

**Status**: Low priority - doesn't affect functionality

## Build Configuration

### OpenAI API Key
**Issue**: `/api/chatwoot-ai-webhook` route requires OpenAI API key to be set

**Workaround**: Set `OPENAI_API_KEY` in `.env.local`:
```bash
OPENAI_API_KEY=sk-...
```

**Status**: Expected behavior - configuration required

### Bundle Analysis
**Issue**: Bundle analyzer not enabled by default

**Workaround**: Enable with environment variable:
```bash
ANALYZE=true npm run build
```

**Status**: By design - optional development tool

## Documentation

### Documentation Updates
**Issue**: Recent documentation consolidation (2025-10-01) moved content around

**Changes**:
- Consolidated 18 overlapping documents into 6 canonical guides
- Archived 9 outdated documents with proper deprecation notices
- Removed all hardcoded credentials (43 files cleaned)
- Verified 100% of code references (23 API routes, 8 components, 12 library files)
- Reduced documentation by 38%

**Action Required**: Always reference canonical documentation in `docs/runbooks/` rather than archived versions

**Status**: Resolved - see `docs/completion_drive_plans/runbooks_analysis.md` for details

## Recent Updates

### Phase C - Day 9 Completed Tasks

#### TypeScript Error Fixes
- Resolved ~25 type errors across the codebase
- Fixed global interface declaration conflicts
- Added proper type assertions for third-party libraries

#### Code Cleanup
- Removed all backup files (`.bak`, `.backup`)
- Cleaned up unused CSS files
- Organized imports and dependencies

#### Design System Migration
- Implemented sophisticated Bloomberg-inspired design
- Integrated Shadcn/ui components
- Updated color palette and typography

### Migration Notes
- **Breaking Changes**: None - all changes are backward compatible
- **Updated Files**: See git status for complete list
- **New Patterns**:
  - Use Shadcn components for new features
  - Apply new color variables from Tailwind config
  - Follow Bloomberg-inspired UI patterns for financial data
  - Always reference canonical documentation (not archived versions)

## Reporting New Issues

When you discover a new issue:
1. Document it in this file with the issue, workaround, and status
2. Create a ticket if it requires immediate attention
3. Update this document when the issue is resolved
4. Remove resolved issues that are no longer relevant
