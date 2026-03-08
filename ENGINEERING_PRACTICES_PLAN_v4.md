# PM CoE Platform — Engineering Practices Plan

**Date:** 2026-03-01 | **Version:** 4 (v2 Architect feedback + v3 MCP consolidation + v4 Requirements Agent escalation)
**Produced by:** Full Stack Dev Agent (Mode 3 session)
**Reviewed by:** Architect Agent
**Triggered by:** Traceability analysis that found 34 discrepancies across the platform

---

## What This Plan Addresses

This session uncovered two categories of problems:

1. **34 discrepancies** — different parts of the system disagree with each other on what valid values are. For example, ARIA AI tools think lead statuses are `active, inactive, converted, unsubscribed`, while the API spec says `new, active, converted, unsubscribed, completed`, and the schema doc says `new, nurturing, converted, unsubscribed, completed`. Every layer has its own version. This causes data corruption — ARIA writes `inactive` to the database, a value nothing else recognizes.

2. **Missing engineering practices** — the codebase has no input validation (the backend accepts any value), no request logging (we can't see what's happening in production), a security misconfiguration (any website can make authenticated API requests), and no automated checks to prevent the discrepancies from recurring.

---

## The Agents

| Agent | What They Own |
|-------|---------------|
| **Requirements Agent (F)** | Business requirements — BRD, Page Briefs, Glossary. Decides what capabilities the system SHOULD have and what business terms mean. Escalation target for capability questions. |
| **Architect (H)** | Technical specifications — API spec, schema doc, architecture doc, design specs. Decides how requirements are technically represented. Also defines architectural policies (CORS, rate limiting). |
| **Full Stack Dev** | All code — backend services, ARIA tools, MCP server tools, frontend pages, shared code, validation, tests. Covers `packages/backend/`, `packages/frontend/`, and `packages/mcp-server/`. |

The MCP Server Agent role has been consolidated into the Full Stack Dev. The MCP server is a thin HTTP wrapper over the backend REST API — the Full Stack Dev already understands both sides and is better positioned to keep them aligned. This eliminates the coordination overhead of a separate agent.

---

## Rollback Strategy

Every phase follows these rules:

1. Each phase is a **separate PR and deployment**. Never batch multiple phases into one deployment.
2. If production verification fails after a deployment, **revert immediately** — either `git revert HEAD` or `railway rollback`.
3. Phase 2 (the largest change) is further broken into sub-phases (2a, 2b, 2c, 2d), each deployed separately.
4. Validation strictness in Phase 2 is introduced with a **warning-then-enforce** approach: first deploy validation that logs invalid values but allows them through, then after confirming no false positives, switch to rejecting invalid values. This avoids blocking production traffic if something was missed.

---

## Phase 0: Fix the Specifications (Architect + Requirements Agent)

Before any code changes, the specifications themselves need to be correct and internally consistent. The traceability analysis found places where the API spec and schema doc disagree with each other — and downstream code picked different sides of the disagreement.

### Decision Classification

Decisions fall into two categories:

| Category | Owner | Examples |
|----------|-------|----------|
| **Naming/Terminology** | Architect | `percent` vs `percentage`, `context` vs `variables`, `active` vs `nurturing` |
| **Capability/Business Logic** | Requirements Agent | "Should journeys support webhook triggers?", "Do we need the `/leads/summary` endpoint?", "What journey node types should exist?" |

**Rule:** If a decision affects what the system *can do* or what a business term *means*, it's a Requirements Agent decision. If it's purely about how an agreed capability is technically named or structured, it's an Architect decision.

### Escalation Protocol

1. **Architect reviews each decision** and classifies it:
   - **Naming decision** → Architect resolves from existing documentation
   - **Capability decision** → Architect escalates to Requirements Agent
   - **Unclear** → Architect escalates to Requirements Agent to be safe

2. **If escalated to Requirements Agent:**
   - Requirements Agent checks BRD, Page Briefs, Glossary
   - If documented: Requirements Agent decides
   - If not documented: Requirements Agent escalates to business stakeholder
   - **Wait for decision. Do not infer or invent values.**

3. **Decisions that are blocked** do not block the entire phase. The Architect resolves what they can, the Requirements Agent resolves what they can, and Phase 1 proceeds with the resolved decisions. Blocked decisions are picked up when the stakeholder responds.

### Decisions Needed

**Decisions the Architect can resolve (naming/terminology):**

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Lead status** — `active` vs `nurturing` | Both mean the same thing. Pick one, update the other. |
| 6 | **Reply classification** — Confirm old names (`positive`, `negative`) are deprecated in favor of new names (`interested`, `not_interested`) | This is terminology migration, not capability change. |
| 7 | **Reply status** — Confirm old names (`pending`, `responded`) are deprecated in favor of new names (`new`, `actioned`) | Same pattern as #6. |
| 8 | **Promo discount type** — `percent`/`fixed` vs `percentage`/`fixed_amount` | Naming preference. Pick one. |
| 14 | **Execution context/variables naming** — Database column is `context`, API returns it as `variables` | Pick one name, align both. |

**Decisions requiring Requirements Agent input (capability/business logic):**

| # | Decision | Why Requirements Agent |
|---|----------|----------------------|
| 2 | **Execution resolve status** — Should `resolved` be a valid status, or use `completed`? | Affects what actions exist on executions. Check BRD §16 (Executions). |
| 3 | **Journey statuses** — 7 defined, 5 used. Which are canonical? | Affects journey lifecycle. Check BRD §6 (Journeys). |
| 4 | **Journey trigger types** — Three different sets exist (`lead, campaign` vs `scheduled, webhook, tag_added` vs `external, score-threshold`). Which is correct? | Affects what can trigger a journey. Check BRD §6.2 (Journey Triggers). |
| 5 | **Survey question types** — Should `payment`, `intro_content`, `stripe_link` be in the spec? | Affects survey capabilities. Check BRD §13 (Surveys). |
| 9 | **Unsubscribe source values** — Schema vs frontend disagree. Which is right? | Affects unsubscribe tracking. Check BRD §7.2 (Unsubscribe). |
| 10 | **Journey node types** — Schema says `send, branch, wait, end`. Production uses `email, delay, condition, end`. | Affects journey builder capabilities. Check BRD §6.3 (Journey Steps). |
| 11 | **Scoring signal category** — ARIA accepts `category` but DB has no column. Add it or remove it? | Affects scoring model. Check BRD §9 (Scoring). |
| 12 | **Alert channel** — Should valid channels be constrained (`email`, `slack`) or free text? | Affects alerting capabilities. Check BRD §17.3 (Notification Settings). |
| 13 | **Enrollment status** — Three different concepts across layers. | Affects enrollment tracking. Check BRD §5.7 (Enrollments). |
| 15 | **Five orphan frontend methods** — Are these capabilities required? | Check Page Briefs for Contact Detail, Journey Detail, Alerts. |

**Decision removed from this plan:**

| # | Decision | Reason |
|---|----------|--------|
| 16 | Six missing ARIA/MCP tools | Feature gaps, not discrepancies. Moved to future capabilities backlog. |

### Phase 0 Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PHASE 0 WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Architect reviews all 15 decisions                                 │
│         │                                                           │
│         ├──► Naming decisions (#1, 6, 7, 8, 14)                     │
│         │         │                                                 │
│         │         └──► Architect resolves from existing docs        │
│         │                                                           │
│         └──► Capability decisions (#2, 3, 4, 5, 9, 10, 11, 12, 13, 15)
│                   │                                                 │
│                   └──► Escalate to Requirements Agent               │
│                               │                                     │
│                               ├──► Documented in BRD/Page Briefs?   │
│                               │         │                           │
│                               │         ├──► Yes: Requirements Agent decides
│                               │         │                           │
│                               │         └──► No: Escalate to business stakeholder
│                               │                     │               │
│                               │                     └──► WAIT       │
│                               │                                     │
│                               └──► Decision returned to Architect   │
│                                         │                           │
│                                         └──► Architect updates specs│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 0 Deliverables

| Deliverable | Description |
|-------------|-------------|
| `api-spec_v5.yaml` | Version increment with all resolved decisions applied. Replaces v4. |
| `schema_v3_2.sql` | Version increment with all resolved decisions applied. Replaces v3.1. |
| Decision Log entries | New entries D-9 through D-XX in `ARCHITECTURE_v4.0.md` documenting each decision and its rationale |
| Change Request document | Links each decision to this plan and to the discrepancy IDs that triggered it |
| Blocked decisions list | Any decisions awaiting Requirements Agent or business stakeholder response, with status |

### Phase 0 Verification

**Who verifies:** Full Stack Dev runs a Mode 3 traceability check (Documents 1-2 only — spec and schema) to confirm zero contradictions between the two documents. This is the CDR-005 (Source Truth Alignment) check.

**Exit criteria:** Every enum value set in the API spec matches the corresponding known-value comment in the schema doc. Zero CDR-005 failures. Blocked decisions are documented but do not block Phase 1 for the resolved decisions.

---

## Phase 1: Build the Enum Registry (Full Stack Dev)

**What this is:** A script that reads the API spec and automatically generates a TypeScript file (`shared/enums.ts`) containing every enum as a reusable constant. This file becomes the single code-level representation of the values defined in the spec.

**Why it's generated, not hand-written:** If someone hand-writes the enum file, it can drift from the spec — which is the exact problem we're solving. By generating it from the spec, they can never disagree. The API spec (owned by the Architect) remains the source of truth.

**What it looks like:**
- A generation script reads every `enum:` field from the API spec YAML
- It produces `shared/enums.ts` with exports like `LEAD_STATUS`, `EXECUTION_STATUS`, `REPLY_CLASSIFICATION`, etc.
- The existing `npm run generate-types` command is extended to also run this script
- CI already checks that generated types aren't stale — the same check is added for the enum file

**What changes:**
- New file: `scripts/generate-enums.ts` (the generator)
- New file: `shared/enums.ts` (the output — never edited by hand)
- Updated: root `package.json` (adds enum generation to existing type generation command)
- Updated: `packages/mcp-server/tsconfig.json` (so MCP can import shared enums — currently independent)
- Updated: `packages/frontend/tsconfig.json` (so frontend can import shared enums)
- Updated: `.github/workflows/ci.yml` (adds staleness check for enum file)

---

## Phase 2: Fix All Discrepancies + Validate Inputs (Full Stack Dev)

With the enum registry generated, every file that currently has its own hardcoded list of values gets updated to import from the registry instead. This phase also adds Zod route validation and service-layer validation — input validation is a data integrity requirement, not a developer experience nicety.

All sub-phases are handled by the Full Stack Dev, who owns backend, frontend, and MCP server.

### Phase 2a: Backend validation + ARIA tools + MCP tools (Full Stack Dev)

- Add `zod` to backend dependencies
- Create Zod validation schemas for all route request bodies and query parameters, importing enums from the registry
- Create `validateBody`/`validateQuery` middleware
- Add `validateEnum()` utility to backend services
- Add validation calls to all service write methods (LeadService, JourneyService, ExecutionService, SurveyService, ReplyService, PromoCodeService, AlertService, ScoringService)
- Update all 12 ARIA tool files — replace hardcoded enum arrays with imports from `shared/enums.ts`
- Update all 13 MCP tool files — replace hardcoded zod enum values with imports from `shared/enums.ts`
- Fix ARIA system prompt — replace hardcoded factual claims with values from the registry
- Fix ARIA platform context queries — replace queries for non-existent status values
- Fix ARIA scoring `category` handling based on Architect decision
- Fix execution `resolved` status based on Architect decision
- **Deploy with validation in warning mode first** — log invalid values but allow them through

**Estimated effort:** 4-5 days

### Phase 2b: Frontend (Full Stack Dev — after 2a)

- Update frontend pages to import dropdown/filter values from `shared/enums.ts` (ContactList, JourneyList, Executions, ReplyInbox, UnsubscribeList, SurveyList)
- Remove or implement the 5 orphan frontend client methods based on Requirements Agent decision (#15)
- Fix unsubscribe source filter values to match spec

**Estimated effort:** 2-3 days

### Phase 2c: Data Remediation (Full Stack Dev — after 2a, 2b deployed)

The code changes in 2a-2b fix the write paths going forward, but existing bad data is still in the database. Records written with invalid values (e.g., `status: 'inactive'`, `classification: 'positive'`) will not be found by queries using the correct values.

Steps:
1. **Query for records with invalid values** — for each value set that had discrepancies, count how many rows have non-canonical values
2. **Decide remediation strategy per field** — the Architect decides:
   - **Map to correct value** (e.g., `inactive` → `new`, `positive` → `interested`)
   - **Flag for manual review** (if the correct mapping is ambiguous)
   - **Leave as-is with a note** (if the field is non-critical)
3. **Write and run a remediation migration** — a SQL migration that updates the bad data
4. **Verify no invalid values remain** — query each field to confirm all values are now canonical

**Estimated effort:** 1-2 days

### Phase 2d: Switch validation to enforce mode (Full Stack Dev)

After confirming no false positives from warning-mode validation:
- Switch all validation from "log and allow" to "reject with VALIDATION_ERROR"
- Deploy and verify

**Estimated effort:** Half day

---

## Phase 3: Alignment Tests (Full Stack Dev)

Automated tests that run on every pull request and reject the PR if any layer's enum values don't match the registry.

**Five tests:**

1. **Spec-to-registry test** — Parses the API spec and compares every enum against `shared/enums.ts`. Catches the gap we identified: if someone updates the spec but doesn't regenerate the registry.

2. **ARIA-to-registry test** — Imports every ARIA tool's `input_schema` and compares enum fields against the registry.

3. **MCP-to-registry test** — Imports every MCP tool's zod schema and compares enum fields against the registry.

4. **Frontend-to-registry test** — Verifies that filter dropdown options and form select options in frontend pages import from the registry (or match registry values if using a local copy for rendering reasons).

5. **Schema-to-registry test** — Verifies that database CHECK constraints (for platform tables) and known-value comments (for application tables) match the registry values.

**CI is updated** to also run MCP server tests (currently only backend and frontend run in CI).

**After this phase:** Discrepancies cannot be reintroduced. Any PR that adds a wrong enum value to any layer will fail CI.

---

## Phase 4: Security and Observability (Full Stack Dev)

These are independent fixes. Can run in parallel with Phases 1-3.

**Prerequisite:** The Architect adds architecture decisions before implementation:
- **D-XX: CORS Policy** — specifies which origins are allowed (production frontend URL, staging URL if applicable, localhost for development)
- **D-XX: Rate Limiting Policy** — specifies limits per endpoint category (public endpoints, authenticated endpoints, admin endpoints)

The Full Stack Dev then implements per those decisions.

### CORS Security Fix
**Problem:** The backend currently accepts authenticated requests from any website. The setting is `cors({ origin: true, credentials: true })` — this means a malicious page could make API calls using a logged-in user's session.
**Fix:** Replace with an explicit allowlist per the Architect's CORS Policy decision.

### Request Logging
**Problem:** Zero visibility into what requests hit the server. When investigating the discrepancies, we couldn't tell what was actually being sent.
**Fix:** Add middleware that logs every request as structured JSON — method, path, status code, response time, and which user made the request.

### Structured Logging
**Problem:** The backend uses `console.log` with ad-hoc prefixes. No log levels, no consistent format, no way to search or filter in production.
**Fix:** Replace all logging with a proper structured logger (`pino`) that outputs JSON with timestamps and levels.

### Rate Limiting
**Problem:** The lead capture endpoint is public (no login required) and has no rate limit. Anyone can flood it with fake leads. The login endpoint is also unprotected against brute-force attempts.
**Fix:** Add rate limiting per the Architect's Rate Limiting Policy decision.

---

## Phase 5: Developer Experience (Full Stack Dev)

Lower priority than Phases 1-4. Improves speed and quality of future development.

### Frontend Data Caching (React Query)
Replace the current pattern where every page fetches all its data from scratch on every navigation. Add TanStack Query for automatic caching, background refresh, and deduplication. Navigating back to a page shows cached data immediately instead of a loading spinner.

### Form Library (React Hook Form)
Replace the current pattern where every form page manages its own state with 5-10 useState calls. Use React Hook Form for consistent form state management, validation, and submission handling.

### ESLint + Pre-Commit Hooks
Add linting rules and pre-commit hooks so code quality issues are caught before code is pushed, not in CI.

---

## Phase 6: Quality and Operations (Full Stack Dev)

Lowest priority. Adopt incrementally over time.

### Frontend Component Tests
Add tests for frontend page components. Currently the frontend has almost no tests while the backend has 34 test files.

### Error Tracking (Sentry)
Add automatic error capture and alerting. Currently errors are only visible if someone checks Railway logs manually.

### Staging Environment
Configure a separate environment so changes can be tested before hitting production. Currently every push to `main` goes directly to production.

---

## Documentation Updates (Architect — after each phase)

| After | Architect Updates |
|-------|-------------------|
| Phase 0 | Publish `api-spec_v5.yaml`, `schema_v3_2.sql`, and decision log entries |
| Phase 2 complete | Update `docs/traceability/3_value_set_matrix.md` — all value sets should show OK |
| Phase 2 complete | Update `docs/traceability/5_discrepancy_log.md` — mark resolved discrepancies with commit hashes |
| Phase 3 complete | Add Architecture Decision D-XX: Centralized Enum Registry to the architecture doc |
| Phase 3 complete | Document alignment test requirements in architecture doc |
| Phase 4 (pre) | Add CORS Policy and Rate Limiting Policy decisions to architecture doc |
| Phase 4 complete | Update architecture doc with implementation details |

---

## How to Verify Each Phase

| Phase | How You Know It Worked | Who Verifies |
|-------|----------------------|--------------|
| **0** | Full Stack Dev runs Mode 3 traceability check (CDR-005) on spec and schema. Zero contradictions. | Full Stack Dev |
| **1** | Running `npm run generate-types` produces `shared/enums.ts`. CI rejects PRs where this file is stale. | Full Stack Dev |
| **2a** | Deploy with validation in warning mode. Check Railway logs for any invalid value warnings. Use MCP tools to create/update resources with old invalid values (e.g., `status: "inactive"`) — should see warning in logs. | Full Stack Dev |
| **2b** | Frontend dropdown values match backend accepted values. No 404s from orphan methods (either routes added or methods removed). | Full Stack Dev |
| **2c** | Query each field: `SELECT DISTINCT status FROM leads` (etc.) — all values are canonical. Zero invalid values remain. | Full Stack Dev |
| **2d** | Try creating a lead with `status: "inactive"` via MCP — should be rejected with `VALIDATION_ERROR`. Try with `status: "new"` — should succeed. | Full Stack Dev |
| **3** | Intentionally change one ARIA tool enum to a wrong value and push a PR. CI fails with a clear message about which enum doesn't match. | Full Stack Dev |
| **4** | Make an API request from an unknown origin — it's rejected. Check Railway logs — every request appears as a structured JSON entry. Hit the login endpoint beyond the limit — returns 429. | Full Stack Dev |
| **5** | Send a malformed request body — get a clear validation error. Navigate between pages — previously visited pages load instantly from cache. | Full Stack Dev |

---

## Phase Sequence and Dependencies

```
Phase 0 (Architect + Requirements Agent)    Spec cleanup. No code changes.
    │                                        Blocked decisions escalated, do not hold up resolved ones.
    ▼
Phase 1 (Full Stack Dev)                    Enum generation pipeline. Depends on Phase 0 resolved decisions.
    │
    └──► Phase 2a (Full Stack Dev)          Backend + ARIA + MCP tools. Depends on Phase 1.
              │
              └──► Phase 2b (Full Stack Dev)    Frontend. After 2a.
                        │
                        └──► Phase 2c (Full Stack Dev)    Data remediation. After 2a+2b deployed.
                                  │
                                  └──► Phase 2d (Full Stack Dev)    Enforce validation. After 2c clean.
    │
    ▼
Phase 3 (Full Stack Dev)                    Alignment tests. After Phase 2 complete.

Phase 4 (Architect → Full Stack Dev)        Architect defines policies, FSD implements.
                                            Independent — can run parallel with Phases 1-3.

Phase 5 (Full Stack Dev)                    React Query, forms, ESLint. After Phase 3.

Phase 6 (Full Stack Dev)                    Frontend tests, Sentry, staging. Ongoing.
```

---

## Timeline Summary

| Phase | Agent | What | Estimated Effort |
|-------|-------|------|-----------------|
| 0 | Architect + Requirements Agent | Fix the specs — Architect resolves naming, Requirements Agent resolves capabilities | 2-3 days |
| 1 | Full Stack Dev | Build enum generation pipeline | 1 day |
| 2a | Full Stack Dev | Backend validation + ARIA tools + MCP tools (warning mode) | 4-5 days |
| 2b | Full Stack Dev | Frontend enum imports + orphan cleanup | 2-3 days |
| 2c | Full Stack Dev | Production data remediation | 1-2 days |
| 2d | Full Stack Dev | Switch validation to enforce mode | Half day |
| 3 | Full Stack Dev | Alignment tests (5 tests + CI update) | 2-3 days |
| 4 | Architect (policy) + Full Stack Dev (code) | CORS, logging, rate limiting | 2-3 days |
| 5 | Full Stack Dev | React Query, forms, ESLint | ~2 weeks |
| 6 | Full Stack Dev | Frontend tests, Sentry, staging | Ongoing |

**Phases 0 through 4 address the immediate problems (data corruption, security, observability). Phases 5-6 are quality-of-life improvements.**

---

## Feedback Incorporated

### v2 — Architect review (12 points)

| # | Feedback | How Addressed |
|---|----------|---------------|
| 1 | No escalation path for business decisions | Added Escalation Protocol to Phase 0 |
| 2 | No production data remediation | Added Phase 2c (data remediation) |
| 3 | No rollback strategy | Added Rollback Strategy section + warning-then-enforce approach |
| 4 | Phase 0 output format unspecified | Added Phase 0 Deliverables table with version increments and decision log |
| 5 | MCP Agent coordination missing | Resolved in v3 — MCP agent consolidated into Full Stack Dev |
| 6 | Decision #15 is ambiguous | Reframed to check BRD/Page Briefs first, with escalation path |
| 7 | Decision #16 is future scope | Removed from plan, moved to future capabilities backlog |
| 8 | Alignment tests incomplete | Expanded from 3 to 5 tests (added frontend-to-registry and schema-to-registry) |
| 9 | Phase 4 needs architecture decisions first | Added prerequisite: Architect defines CORS and rate limiting policies before implementation |
| 10 | No verification for Phase 0 | Added: Full Stack Dev runs Mode 3 CDR-005 check |
| 11 | Effort estimates optimistic | Phase 2 broken into sub-phases with individual estimates |
| 12 | Zod validation in wrong phase | Moved from Phase 5 to Phase 2a (data integrity, not developer experience) |

### v3 — MCP agent consolidation

| # | Change | Rationale |
|---|--------|-----------|
| 13 | MCP Server Agent role removed | Consolidated into Full Stack Dev. The MCP server is a thin HTTP wrapper — the Full Stack Dev already understands both sides and is better positioned to keep them aligned. |
| 14 | Phase 2 Coordination Protocol removed | No longer needed — one agent handles all code across backend, MCP, and frontend. |
| 15 | Phase 2b (MCP tools) merged into Phase 2a | MCP tool updates are now part of the same work stream as backend + ARIA tools. Former phases 2c/2d/2e renumbered to 2b/2c/2d. |
| 16 | CLAUDE.md write scope updated | Full Stack Dev now has write access to `packages/mcp-server/src/` and `packages/mcp-server/tests/`. |

### v4 — Requirements Agent escalation paths

| # | Change | Rationale |
|---|--------|-----------|
| 17 | Added Requirements Agent to Agents table | Requirements Agent (F) owns BRD, Page Briefs, Glossary — escalation target for capability decisions. |
| 18 | Added Decision Classification table | Distinguishes naming/terminology decisions (Architect) from capability/business logic decisions (Requirements Agent). |
| 19 | Split decisions into two tables by owner | 5 decisions for Architect, 10 decisions for Requirements Agent — clear ownership. |
| 20 | Added Phase 0 Workflow diagram | Visual escalation path: Architect → Requirements Agent → Business Stakeholder. |
| 21 | Updated Phase 0 header | Changed from "Architect" to "Architect + Requirements Agent". |
| 22 | Updated blocked decisions deliverable | Now includes "awaiting Requirements Agent or business stakeholder response". |
