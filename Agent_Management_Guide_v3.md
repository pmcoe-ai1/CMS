**PM CoE System Rebuild**

Agent Management & Orchestration Guide

5 Agents | 6 Phases | UI-First Workflow | Zero Downtime Migration

Version 3.0 --- March 2026

Table of Contents

1\. Overview & Principles

2\. The Five Agents

3\. Repository Structure

4\. Orchestration Files

5\. Phase B0: Foundation

6\. Phase B1: UI Design (Interactive)

7\. Phase B2: Build

8\. Phase B3: Integration

9\. Phase B4: Widget

10\. Phase B5: Migration

11\. Daily Operating Rhythm

12\. Claude Code Commands Reference

13\. Cross-Agent Communication

14\. Self-Learning Framework

15\. Red Flags & Troubleshooting

16\. Specifications: Where to Write Them

17\. Appendix: Agent File Templates

1\. Overview & Principles

This document defines how to manage a five-agent development team using
Claude Code to rebuild the PM CoE email campaign and lead management
system. The rebuild replaces the existing v38/v50 server.js with a
unified Object-Based Architecture Platform while maintaining zero
downtime for live operations.

**The critical difference from traditional builds: this project follows
a UI-first workflow. The frontend is designed and approved before the
backend is built. This ensures you see and validate every screen before
development resources are committed.**

1.1 Core Principles

**One repo, one machine, one Claude Code session at a time.** You do not
run multiple simultaneous sessions. You run one session scoped to one
agent's role at a time. The repo structure is the coordination layer.

**The UI is the specification.** UI pages are designed interactively in
Claude.ai before any code is written. Once you approve a page,
it becomes the contract that the Full-Stack Coding Agent builds against. 
The approved UI tells the coding agent exactly what endpoints are needed, 
what data shapes to return, and what operations to support.

**The architecture documents are the source of truth.** ARCHITECTURE.md,
SERVICE_REGISTRY.yaml, EXECUTION_ENGINE_SPEC.md, app-schema.json,
api-spec.yaml, and schema.sql define the platform. Every agent reads the
relevant documents before every session. If the code doesn't match the
spec, the code is wrong.

**Design in Claude.ai. Build in Claude Code.** UI design, spec writing,
and architecture decisions happen in Claude.ai where you can iterate
conversationally. Once approved, the output drops into the repo and
Claude Code implements it.

2\. The Five Agents

  ----------------------- ----------------------- -----------------------
  **Agent**               **Territory**           **Authority**

  **Full-Stack Coding     api/, frontend/,        Owns all implementation:
  Agent**                 widget/, tests/,        services, UI, widget,
                          infra                   tests, CI/CD, deployment

  **Design Agent**        frontend/designs/       Owns visual language,
                                                  interaction patterns,
                                                  layout, UI/UX decisions

  **Requirements Agent**  requirements/           Owns business requirements,
                                                  page briefs, acceptance
                                                  criteria

  **Project Manager       PROGRESS.md,            Owns scope, schedule,
  Agent**                 orchestration files     agent assignments, phase
                                                  gates, risk register

  **Solution Architect    Architecture docs:      Owns technical architecture,
  Agent**                 ARCHITECTURE.md,        object model, service
                          api-spec.yaml,          design, API spec, database
                          SERVICE_REGISTRY.yaml,  schema, journey definitions
                          schema.prisma,
                          definitions/
  ----------------------- ----------------------- -----------------------

Full-Stack Coding Agent

Territory: api/, frontend/, widget/, tests/, infrastructure files

The single coding agent who builds everything. On the backend: Node.js/Express 
API server, all object services (EmailService, UnsubscribeService, 
ContactService, EnrollmentService, etc.), the execution engine, all 
scheduled jobs, and webhook handlers. On the frontend: React single-page 
application from the UI designs approved during Phase B1. For the widget:
standalone JavaScript widget for pm-coe.com. For testing: unit tests, 
contract tests, E2E tests, load tests. For DevOps: CI pipeline, environments,
deployments.

The Full-Stack Coding Agent builds against approved UI pages and architecture 
specs. If the UI shows a campaign list sorted by date with open/click rates, 
this agent knows exactly what the GET /campaigns endpoint must return AND 
how the React component should render it.

Design Agent

Environment: Claude.ai (interactive artifacts)

Designs all UI pages interactively during Phase B1. Produces annotated 
wireframes, interactive React artifacts, and design specifications. Works
from approved page briefs provided by Requirements Agent. Does not write
production code — produces design specs that the Full-Stack Coding Agent
implements.

Requirements Agent

Environment: Claude.ai (conversational)

Translates business needs into structured page briefs before design begins.
Asks questions to surface requirements, identifies edge cases, defines
acceptance criteria. Works upstream of Design Agent — every design session
starts with an approved brief.

Project Manager Agent

Environment: Claude.ai (planning) + Claude Code (PROGRESS.md updates)

Owns project scope, schedule, and orchestration. Manages phase gates,
risk register, and cross-agent coordination. The single point of contact
between you (the product owner) and all other agents.

Solution Architect Agent

Environment: Claude.ai (design) + Claude Code (validation)

Owns all technical architecture documents. Defines the object model,
service interfaces, API specification, database schema, and journey
definitions. Consulted before any architecture-impacting decision.
The technical authority.

3\. Repository Structure

The repo structure reflects the consolidated agent model. The Full-Stack
Coding Agent works across all code directories while maintaining clear
separation from architecture documents.

3.1 Directory Layout

> pmcoe-platform/
>
> PROGRESS.md ← Master tracker
>
> CODING_AGENT.md ← Full-Stack Coding Agent state and scope
>
> ORCHESTRATION.md ← How-to guide for running agents
>
> ARCHITECTURE.md ← Platform rulebook (read every session)
>
> SERVICE_REGISTRY.yaml ← All services with published interfaces
>
> EXECUTION_ENGINE_SPEC.md ← Engine runtime specification
>
> app-schema.json ← Definition validation schema
>
> api-spec.yaml ← OpenAPI 3.0 specification
>
> schema.prisma ← Database schema
>
> docker-compose.yml ← Local dev environment
>
> Dockerfile ← Multi-stage build
>
> .github/workflows/ci.yml ← CI pipeline
>
> api/ ← FULL-STACK CODING AGENT (backend)
>
> services/ routes/ engine/ jobs/ \_\_tests\_\_/
>
> frontend/ ← FULL-STACK CODING AGENT (frontend)
>
> src/ components/ pages/ lib/ \_\_tests\_\_/
>
> designs/ ← Approved designs from Design Agent
>
> widget/ ← FULL-STACK CODING AGENT (widget)
>
> widget.js widget.css \_\_tests\_\_/
>
> tests/ ← FULL-STACK CODING AGENT (testing)
>
> contract/ e2e/ load/ utils/ mswHandlers.js
>
> definitions/ ← SOLUTION ARCHITECT AGENT
>
> lead-capture.yaml nurture-sequence.yaml \...
>
> requirements/ ← REQUIREMENTS AGENT
>
> page-briefs/
>
> .claude/ ← SELF-LEARNING FRAMEWORK
>
> CLAUDE-platform.md CLAUDE-coding-agent.md \...

3.2 Boundary Rules

The Full-Stack Coding Agent creates and edits files in api/, frontend/,
widget/, and tests/, plus infrastructure files in the root. The Solution
Architect Agent owns architecture documents and definitions/. The Design
Agent produces artifacts in frontend/designs/. The Requirements Agent
produces briefs in requirements/. The architecture documents and API spec
are the shared coordination mechanism.

4\. Orchestration Files

Four markdown files coordinate the work. These live in the repo root and
are read/updated by Claude Code at the start and end of every session.

  ---------------------- ----------------------------------------------------
  **File**               **Purpose**

  **PROGRESS.md**        Master tracker. Phase status, deliverable
                         checklists, decisions log, blockers. Updated every
                         session.

  **CODING_AGENT.md**    Full-Stack Coding Agent state: completed services,
                         completed pages, in-progress work, test coverage,
                         CI/CD status, deployment log, session history.

  **ORCHESTRATION.md**   How-to reference: session commands, daily rhythm,
                         cross-agent context passing patterns.
  ---------------------- ----------------------------------------------------

5\. Phase B0: Foundation

Phase B0 sets up the project infrastructure. No feature code is written
until this phase is complete.

5.1 Full-Stack Coding Agent: Environment + CI + Testing Standards

This work happens in Claude Code. The Full-Stack Coding Agent reads the 
architecture documents and builds all infrastructure.

  ------------------------ ----------------------------------------------
  **Deliverable**          **Purpose**

  **docker-compose.yml**   Local dev: PostgreSQL 16, MailHog (fake SMTP),
                           API server, frontend dev server

  **schema execution**     Create all tables, indexes, triggers
                           in local and staging databases

  **seed data**            Test data: leads, campaigns, surveys,
                           replies, sample definitions

  **Railway staging        Staging services: API, frontend, PostgreSQL
  project**                with sandbox API keys

  **GitHub Actions CI**    Jobs: lint, unit test, contract test, E2E
                           test, coverage report

  **Dockerfile**           Multi-stage build for API + static frontend
                           build

  **Jest + Playwright      Unit test and E2E test configuration
  config**                 

  **.env.local +           Environment variable templates
  .env.staging**           

  **TESTING.md**           Test naming, mock patterns, coverage
                           thresholds (services 90%, routes 80%,
                           components 70%)

  **MSW handlers**         Mock Service Worker handlers generated from
                           api-spec.yaml for frontend development

  **Self-learning setup**  Create all CLAUDE-\*.md files, configure
                           /post-run command
  ------------------------ ----------------------------------------------

5.2 Phase B0 Gate

**Phase B0 is complete when: all environments are operational (local
Docker starts, staging deploys, CI pipeline runs green on empty test
suite), database schema is deployed to local and staging, self-learning
framework is configured, and the Full-Stack Coding Agent confirms 
readiness to proceed.**

6\. Phase B1: UI Design (Interactive)

**This is where the UI-first workflow begins. Phase B1 happens entirely
in Claude.ai, not in Claude Code. You work with the Requirements Agent
and Design Agent to define and design every UI page interactively. You 
react to what you see. You refine until each page is exactly right. Only 
then does it become the specification that the Full-Stack Coding Agent
builds against.**

6.1 How It Works

For each page, you work through the following cycle:

1.  Requirements Agent interviews you about the business need. Produces
    an approved page brief.

2.  Design Agent reads the brief and produces an annotated wireframe.
    You approve the structure.

3.  Design Agent produces an interactive React artifact. You see it 
    rendered live in Claude.ai.

4.  You react. Move this here. Add a filter. Remove that column. Make
    the send button more prominent. I need to see open rates.

5.  Design Agent iterates. The artifact updates. You see the new version
    immediately.

6.  Repeat steps 4-5 until the page is approved.

7.  Design Agent produces the Design Specification document.

8.  Solution Architect Agent reviews for API spec gaps and updates if
    needed.

9.  The approved artifacts and specs become the contract for the
    Full-Stack Coding Agent.

6.2 What Gets Designed

Every page the admin will use. The Phase A architecture documents
(api-spec.yaml, schema.prisma) define what data exists. Phase B1 defines
how that data is presented and interacted with.

  ------------------ ---------------------- ------------------------------
  **Business Area**  **Pages**              **Key Interactions**

  **Campaigns**      List, Compose, Detail, Select audience, pick
                     Recipients             template, preview, send, view
                                            delivery progress

  **Leads**          List, Detail           Filter by status/course/tag,
                                            view nurture progress, manual
                                            status change

  **Surveys**        List, Builder, Detail, Add/reorder questions,
                     Results                configure types, view
                                            aggregated results

  **Replies**        Inbox                  See AI classification,
                                            one-click actions (respond,
                                            dismiss, unsubscribe)

  **Templates**      List, Editor, Preview  HTML editing, variable
                                            insertion, live preview with
                                            sample data

  **Contacts**       List, Import           Search, filter by tag, bulk
                                            CSV import

  **Unsubscribes**   Admin List             Search, filter by scope,
                                            resubscribe action

  **Settings**       Gmail, General         OAuth connection status,
                                            system configuration

  **Platform**       Executions,            Execution monitoring,
                     Definitions, Registry  definition CRUD, service
                                            browser
  ------------------ ---------------------- ------------------------------

6.3 Phase B1 Gate

**Phase B1 is complete when: every page has an approved brief AND an
approved design. The approved artifacts are saved in the repo as reference 
designs. Any API spec adjustments discovered during UI design have been 
applied to api-spec.yaml. The UI design is the contract — the Full-Stack
Coding Agent builds to match it exactly.**

7\. Phase B2: Build

Now that every UI page is approved, the Full-Stack Coding Agent knows 
exactly what to build. Phase B2 is focused implementation: services, API 
routes, React pages, tests.

7.1 Typical Day Structure

  --------------- ----------------------------------------- ---------------
  **Time**        **Activity**                              **Duration**

  **Morning**     Build 1-2 services with unit tests        2-3 hours

  **Midday**      Run contract tests, fix any issues        30 min

  **Afternoon**   Build 1-2 pages from approved designs     2-3 hours
                  with component tests                      

  **End of day**  Run full test suite, update PROGRESS.md   15 min
  --------------- ----------------------------------------- ---------------

7.2 Full-Stack Coding Agent: Build Sequence

**Backend first, then frontend:**

1. Build services in dependency order from SERVICE_REGISTRY.yaml.
   Start with zero-dependency services (TemplateService, SchedulerService,
   ContactService, AuthService), then services with dependencies
   (EmailService, NotificationService, WebhookService), then the Execution
   Engine, then PM CoE-specific services (EnrollmentService,
   PromoCodeService, SurveyResponseService).

2. Build API routes. The approved UI pages tell the agent exactly what 
   each route must return.

3. Build React pages from approved Design Specifications. Match the
   designs exactly. Use MSW mock handlers until integration phase.

4. Write all tests: unit tests for services, component tests for pages,
   contract tests for API.

7.3 Phase B2 Gate

**Phase B2 is complete when: all services are built with unit tests,
all API routes are implemented, the execution engine processes
definitions correctly, all UI pages are built as production React with
component tests, all contract tests pass, coverage thresholds are met
(services 90%, routes 80%, components 70%).**

8\. Phase B3: Integration

Connect everything. Replace MSW mocks with real API calls. You test by
using the UI — the same pages you approved in Phase B1, now running
against real services and real data.

8.1 Integration Sequence

1.  Full-Stack Coding Agent deploys API to staging Railway. Verifies 
    scheduled jobs run.

2.  Full-Stack Coding Agent switches frontend from MSW mocks to real 
    staging API. Fixes any contract mismatches. Deploys frontend to staging.

3.  Full-Stack Coding Agent runs contract tests against staging API.

4.  Full-Stack Coding Agent runs all E2E workflow tests against staging.

5.  Full-Stack Coding Agent runs failure/recovery and load tests.

6.  You test the UI manually. Open each page, try each workflow. Does
    the campaign page look and behave like the design you approved? Does
    the lead list show the right data?

7.  Full-Stack Coding Agent generates coverage report and gives GO or NO-GO.

8.2 Fixing Integration Failures

When you or tests find issues, the fix cycle is: document the issue,
fix the code, redeploy to staging, re-validate. This loop typically 
runs 3-5 times during integration. Your UI testing is a critical part 
of this phase — you catch UX issues that automated tests miss.

8.3 Phase B3 Gate

**Phase B3 is complete when: all automated tests pass on staging, you 
have personally tested every UI page against the real API and confirmed 
it matches your approved designs, load test passes, coverage thresholds 
are met, and zero critical or high-severity bugs are open. This sign-off 
is the ONLY authorization for production deployment.**

9\. Phase B4: Widget

The Full-Stack Coding Agent builds the standalone lead capture widget 
for pm-coe.com. This is a self-contained piece: a form that posts to 
POST /leads/capture. Built as vanilla JS + CSS, under 50KB, 
mobile-responsive, no global CSS leaks. Can be designed interactively 
in Claude.ai first, just like the dashboard pages.

9.1 Phase B4 Gate

**Phase B4 is complete when: the widget renders correctly on pm-coe.com
in a test embed, form submission creates a lead and starts a nurture
execution, promo code displays correctly, mobile layout works at 320px,
and widget functional tests pass.**

10\. Phase B5: Migration

The Full-Stack Coding Agent owns every deployment. Subsystems are migrated 
one at a time with monitoring gaps between each.

10.1 Production Setup

Full-Stack Coding Agent adds new Railway services (pmcoe-api, pmcoe-frontend) 
to the existing production project alongside the old server.js. Both systems
read the same PostgreSQL database. The old system continues handling all
traffic until subsystems are migrated.

10.2 Migration Sequence

  ---------- --------------- --------------------------- ------------------
  **Days**   **Subsystem**   **Key Actions**             **Rollback**

  **1-2**    Campaigns       Disable old scheduler,      Re-enable old
                             enable new executor, test   scheduler
                             send, monitor 24h           

  **3-4**    Surveys         Point /survey/:id to new    Revert route to
                             API, test submit, monitor   old API
                             24h                         

  **5-7**    Lead Nurture    Point widget to new API,    Revert widget
                             enable nurture sequences,   endpoint
                             monitor 48h                 

  **8**      Complete        All subsystems on new       Old system still
                             system, old system idle     running
  ---------- --------------- --------------------------- ------------------

**Critical rule: existing mid-sequence leads stay on the old system.
They are never migrated mid-sequence. They complete naturally within 14
days. Only new leads enter the new system.**

10.3 Hot-Fix Path

During migration, all bug fixes follow this path: fix locally, push to
staging, validate on staging, promote to production. No exceptions. No 
direct production pushes.

10.4 Post-Migration Monitoring (14 Days)

Monitor daily: execution engine advancing all executions, email
delivery with no bounces or duplicates, unsubscribe links working,
Stripe webhooks processing, reply detection running. The old server.js
stays alive for the full 14 days. Only after 14 clean days is the final 
sign-off given to decommission.

10.5 Phase B5 Gate

**Phase B5 is complete when: 14 clean days on the new system, zero
missed emails, zero duplicate sends, final sign-off given, old
server.js is decommissioned.**

11\. Daily Operating Rhythm

11.1 Morning Startup (5 minutes)

Open Claude Code. Say: 'Read PROGRESS.md. What is the highest priority
work for today?' Claude Code reads the file, gives you the plan, and 
you start.

11.2 Work Block 1 (2-3 hours)

Start a coding session with: 'You are the Full-Stack Coding Agent. Read 
CLAUDE-platform.md and CLAUDE-coding-agent.md for learned patterns. Then 
read CODING_AGENT.md and PROGRESS.md. Continue with the next task.' 
Claude Code picks up exactly where the last session left off.

11.3 Midday Check (15 minutes)

Run all tests. Report any failures. This catches issues before they 
compound. 

11.4 Work Block 2 (2-3 hours)

Continue with the next priority task.

11.5 End of Day (5 minutes)

Run the full test suite. Update PROGRESS.md with today's status.

11.6 Session Templates

**Starting a coding session:**

> You are the Full-Stack Coding Agent. Read CLAUDE-platform.md and 
> CLAUDE-coding-agent.md for learned patterns. Then read CODING_AGENT.md 
> and PROGRESS.md for current state. Continue with the next task.

**Ending a session:**

> Run /post-run to capture learnings from this session.
>
> Then update CODING_AGENT.md with what you built, decisions made, and
> next steps.
>
> Then update PROGRESS.md with overall status.

12\. Claude Code Commands Reference

12.1 Phase B0 Commands

**Start foundation setup:**

> You are the Full-Stack Coding Agent. Read CODING_AGENT.md. Set up the 
> project: docker-compose.yml, Jest config, Playwright config, GitHub 
> Actions CI, seed data, self-learning framework. The architecture docs 
> are in the repo root.

12.2 Phase B2 Commands

**Build a service:**

> You are the Full-Stack Coding Agent. Read CODING_AGENT.md. Build 
> EmailService in api/services/email/index.js matching SERVICE_REGISTRY.yaml 
> exactly. Write unit tests. Run tests and fix failures before finishing.

**Build from approved design:**

> You are the Full-Stack Coding Agent. Read CODING_AGENT.md. Build the 
> Campaign List page at frontend/src/pages/CampaignList.jsx. The approved 
> design is in frontend/designs/campaign-list.jsx and the spec is in
> frontend/designs/campaign-list-spec.md. Match it exactly. Use MSW 
> handlers from tests/utils/mswHandlers.js. Write component tests.

12.3 Phase B3 Commands

**Connect frontend to staging:**

> You are the Full-Stack Coding Agent. Switch from MSW mocks to the real 
> staging API at [URL]. Fix any contract mismatches. Log issues in 
> CODING_AGENT.md Known Gaps table.

**Full validation:**

> You are the Full-Stack Coding Agent. Run the full test suite against 
> staging: contract, E2E, failure, load tests, and coverage report. 
> Record all results in CODING_AGENT.md. Give GO or NO-GO with reasons.

12.4 Phase B5 Commands

**Migrate a subsystem:**

> You are the Full-Stack Coding Agent. Migrate campaigns to the new system. 
> Disable old scheduler, verify new executor, send test campaign, monitor 
> 24 hours. Update migration tracking in CODING_AGENT.md.

13\. Cross-Agent Communication

Agents never communicate directly. You are the message bus. Here are the
patterns for passing context between agents.

13.1 Design Agent Discovers API Gap

1.  Design Agent notes the gap and what data or operation is missing.

2.  You route it to Solution Architect Agent for evaluation.

3.  Solution Architect Agent determines the minimum change: new endpoint,
    new field, or new query parameter.

4.  Solution Architect Agent updates api-spec.yaml.

5.  Full-Stack Coding Agent builds against the updated spec.

13.2 Full-Stack Coding Agent Finds Architecture Question

1.  Full-Stack Coding Agent documents the question in CODING_AGENT.md.

2.  You route it to Solution Architect Agent for an authoritative answer.

3.  Solution Architect Agent provides the answer and updates architecture
    docs if needed.

4.  Full-Stack Coding Agent implements based on the answer.

13.3 You Discover UX Issue During Integration

1.  Document the issue.

2.  Evaluate: is this a design change or a bug?

3.  If design change: work with Design Agent to update the design, then
    Full-Stack Coding Agent implements.

4.  If bug: Full-Stack Coding Agent fixes directly.

14\. Self-Learning Framework

Every Claude Code session starts fresh. Without a learning mechanism,
agents repeat mistakes and lose operational knowledge. The self-learning
framework makes agents update their own knowledge files from
conversation transcripts.

14.1 Two Tiers of Memory

  ------------- ----------------------- ------------------- ---------------
  **Tier**      **File**                **Loaded When**     **Size Limit**

  **Platform    CLAUDE-platform.md      Every session       250 lines
  Memory**                              

  **Agent       CLAUDE-coding-agent.md  Coding sessions     250 lines
  Memory**                              only          
  ------------- ----------------------- ------------------- ---------------

14.2 When to Run /post-run

-   End of every agent session (mandatory)

-   Every 1-2 hours during long sessions

-   After fixing a difficult bug

-   After a deployment issue

15\. Red Flags & Troubleshooting

  ---------------------- ------------------------ ------------------------
  **Red Flag**           **Why It Matters**       **Fix**

  **Skipping tests**     Untested code fails      No completion without
                         at integration and cost  passing tests.
                         10x to fix               

  **Deviating from       The design was approved  Compare to approved
  approved design**      for a reason. Deviations artifact. Match it
                         create spec mismatches.  exactly.

  **PROGRESS.md not      Next morning is          Last thing in every
  updated**              disorienting, context is session. Non-negotiable.
                         lost                     

  **Tests pass locally,  Usually env variable or  Investigate staging
  fail on staging**      database state issue     environment.

  **Skipping /post-run   Learnings lost forever.  Non-negotiable. Run
  at session end**       Next session repeats     before updating
                         mistakes.                CODING_AGENT.md.

  **UI design skipped or Bad UI = bad spec =      Take the time in Phase
  rushed**               rework                   B1. It's cheaper than
                                                  rebuilding.
  ---------------------- ------------------------ ------------------------

16\. Specifications: Where to Write Them

  -------------------------- ----------- ---------------------------------
  **Work Type**              **Tool**    **Reason**

  **Page briefs**            Claude.ai   Requirements Agent conversation

  **UI page design and       Claude.ai   Design Agent interactive
  iteration**                            artifacts

  **Architecture decisions** Claude.ai   Solution Architect Agent
                                         high-level thinking

  **API spec adjustments**   Claude.ai   Discovered during UI design,
                                         requires discussion

  **Implementing services**  Claude Code Writing code, running tests,
                                         editing files

  **Building React from      Claude Code Faithful implementation with
  approved designs**                     tests

  **Setting up Docker/CI**   Claude Code File creation, command execution

  **Writing tests**          Claude Code Code + execution + iteration on
                                         failures

  **Deployment and           Claude Code Railway CLI, env variables,
  migration**                            monitoring
  -------------------------- ----------- ---------------------------------

**The rule of thumb: if the output is a design or decision, use
Claude.ai. If the output is a file on disk, use Claude Code.**

17\. Appendix: Agent File Templates

See TEMPLATES.yaml for complete templates for CODING_AGENT.md and all 
test templates. These should be placed in the repo root before Phase B0 
begins.

**Key files for the UI-first workflow:**

-   CODING_AGENT.md includes tables for: completed services, completed
    pages, test coverage, CI/CD status, deployment log, session history

-   PROGRESS.md Phase B1 checklist has a checkbox for every page in the
    design sequence

-   frontend/designs/ directory stores all approved React artifacts and
    Design Specifications from Design Agent

*--- End of Document ---*
