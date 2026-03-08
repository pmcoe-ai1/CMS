# PM CoE Platform — Deployment & Coordination Guide

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Railway                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Frontend  │───▶│   Backend   │───▶│  PostgreSQL │     │
│  │   (React)   │    │  (Express)  │    │     16      │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                                 │
│         │                  ▼                                 │
│         │           ┌─────────────┐                         │
│         │           │  Claude API │                         │
│         │           └─────────────┘                         │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │    CDN      │                                            │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Repository Structure (Monorepo)

```
pm-coe-platform/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Runs on every PR
│       ├── deploy-staging.yml  # On merge to main
│       └── deploy-prod.yml     # Manual trigger
│
├── packages/
│   ├── backend/
│   │   ├── CLAUDE.md
│   │   ├── package.json
│   │   ├── src/
│   │   ├── tests/
│   │   └── Dockerfile
│   │
│   └── frontend/
│       ├── CLAUDE.md
│       ├── package.json
│       ├── src/
│       ├── tests/
│       └── Dockerfile
│
├── shared/
│   └── types/
│       └── api.generated.ts    # Generated from OpenAPI
│
├── docs/
│   ├── api-spec_v4.yaml        # Source of truth
│   ├── schema_v3_1.sql
│   └── design-specs/
│
├── scripts/
│   ├── generate-types.sh       # Regenerate types from spec
│   └── setup-local.sh
│
├── docker-compose.yml
├── package.json                # Workspace root
└── CLAUDE.md                   # Root coordination rules
```

---

## CI/CD Pipeline

### On Every PR

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  # Check if types are in sync with API spec
  check-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run generate-types
      - run: git diff --exit-code shared/types/

  # Backend tests
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd packages/backend && npm ci
      - run: cd packages/backend && npm run lint
      - run: cd packages/backend && npm run test
      - run: cd packages/backend && npm run build

  # Frontend tests
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd packages/frontend && npm ci
      - run: cd packages/frontend && npm run lint
      - run: cd packages/frontend && npm run test
      - run: cd packages/frontend && npm run build

  # Contract tests - ensure frontend calls match backend
  contract-tests:
    needs: [backend, frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker-compose up -d
      - run: npm run test:contract
```

### Deploy to Staging (on merge to main)

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Backend
        run: railway up --service backend --environment staging
      - name: Deploy Frontend
        run: railway up --service frontend --environment staging
      - name: Run smoke tests
        run: npm run test:smoke -- --env=staging
```

---

## Defect Management

### Defect Classification

| Severity | Definition | Response Time | Example |
|----------|------------|---------------|---------|
| P0 | System down | < 1 hour | API returns 500 on all requests |
| P1 | Major feature broken | < 4 hours | Cannot create journeys |
| P2 | Feature degraded | < 24 hours | Filter not working correctly |
| P3 | Minor issue | Next sprint | UI alignment issue |

### Defect Workflow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Reported │────▶│ Triaged  │────▶│ Assigned │────▶│  Fixed   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                                  │
                      ▼                                  ▼
               ┌─────────────┐                   ┌─────────────┐
               │ Which layer?│                   │ PR + Review │
               └─────────────┘                   └─────────────┘
                   │     │
          Backend ─┘     └─ Frontend
              │              │
              ▼              ▼
         Full-Stack Coding Agent         Full-Stack Coding Agent
```

### Defect Ownership

| Symptom | Owner | How to Identify |
|---------|-------|-----------------|
| API returns wrong data | Backend | Check Network tab, response body |
| API returns error | Backend | Check server logs |
| UI displays wrong | Frontend | API response correct, UI wrong |
| UI not responding | Frontend | No network request made |
| Integration issue | Both | API contract mismatch |

### Integration Defects

When frontend and backend don't match:

1. **Check api-spec_v4.yaml** — Who deviated?
2. **If backend wrong:** Full-Stack Coding Agent fixes, regenerate types
3. **If frontend wrong:** Full-Stack Coding Agent fixes to match spec
4. **If spec wrong:** Update spec first, then both fix

---

## Coordination Points

### Daily Sync (Async)

Each agent updates a status file:

```markdown
# packages/backend/STATUS.md

## Last Updated: 2026-02-21 14:00

### Completed
- GET /leads with filters
- GET /leads/{leadId}

### In Progress
- POST /ai/chat (AIService)

### Blocked
- None

### API Changes
- None today

### Ready for Frontend
- /leads endpoints ready for integration
```

### API Contract Changes

If an agent needs to change the API:

1. **Propose** — Create PR with api-spec change only
2. **Review** — Other agent reviews impact
3. **Approve** — Both agents agree
4. **Implement** — Backend first, then frontend

```bash
# After API spec change
npm run generate-types
git add shared/types/
git commit -m "chore: regenerate types from api-spec"
```

---

## Local Development

### Start Everything

```bash
# Terminal 1: Database
docker-compose up postgres

# Terminal 2: Backend
cd packages/backend && npm run dev

# Terminal 3: Frontend
cd packages/frontend && npm run dev
```

### Environment Variables

```bash
# packages/backend/.env
DATABASE_URL=postgresql://user:pass@localhost:5432/pmcoe
CLAUDE_API_KEY=sk-ant-...
SESSION_SECRET=local-dev-secret

# packages/frontend/.env
REACT_APP_API_URL=http://localhost:3001/api
```

---

## Hotfix Process (P0/P1)

```
main ─────────────────────────────────────────▶
       │                              ▲
       │ create hotfix branch         │ merge
       ▼                              │
hotfix/fix-journey-api ──────────────┘
       │
       ├── Fix code
       ├── Add regression test
       ├── PR review (expedited)
       └── Deploy immediately
```

```bash
# Create hotfix
git checkout main
git pull
git checkout -b hotfix/fix-journey-api

# Fix, test, commit
npm run test
git commit -m "fix: journey API returning wrong status"

# PR and merge
gh pr create --title "HOTFIX: Journey API status" --base main

# Deploy immediately after merge
railway up --environment production
```

---

## Rollback Process

```bash
# If deployment fails
railway rollback --service backend --environment production

# Or redeploy previous commit
git revert HEAD
git push
# CI/CD deploys automatically
```

---

## Testing Strategy

| Level | What | When | Owner |
|-------|------|------|-------|
| Unit | Individual functions | Every commit | Agent writing code |
| Integration | API endpoints | Every PR | Backend agent |
| Component | React components | Every PR | Frontend agent |
| Contract | Frontend ↔ Backend | Every PR | CI/CD |
| E2E | Full user flows | Before deploy | CI/CD |
| Smoke | Critical paths | After deploy | CI/CD |

### Contract Test Example

```typescript
// tests/contract/leads.test.ts
import { apiSpec } from '../../docs/api-spec_v4.yaml';
import { LeadResponse } from '../../shared/types/api';

describe('GET /leads contract', () => {
  it('response matches OpenAPI spec', async () => {
    const response = await fetch('/api/leads');
    const data: LeadResponse = await response.json();
    
    // Validate against OpenAPI schema
    expect(validateAgainstSpec(data, apiSpec.paths['/leads'].get.responses['200'])).toBe(true);
  });
});
```

---

## Summary

| Concern | Solution |
|---------|----------|
| Code conflicts | Monorepo with separate packages |
| API drift | Generated types from OpenAPI spec |
| Deployment | Single pipeline deploys both |
| Defect ownership | Triage by symptom location |
| Coordination | STATUS.md + API spec as contract |
| Hotfixes | Branch from main, expedited review |
| Rollback | Railway rollback or git revert |
