# Handover Prompt: INIT Bug Fixes — Regression Tests + Code Fix

Copy everything below this line into a new Claude Code session.

---

## Task

Fix 4 bugs in `lib/init.js` (FABRIC's project scaffolding tool) and write regression tests. The fix plan has been fully analysed, verified, and documented. Your job is to implement it exactly as specified, write regression tests, and verify.

## Operating Rules

1. **Be honest and detail-oriented.** Do not make assumptions. Always state facts and never present false information.
2. **Do not make priority calls or decide what's worth doing or not.** Present findings and options — decisions belong to the user.
3. **Do not defer any work.**
4. **When unsure about something, say so.** When something needs to be checked before answering, check it first.
5. **Never fabricate data to fill gaps in knowledge.** If you haven't read the code, say "I haven't checked this." Never present unverified information.
6. **Do not fill in gaps in your knowledge with plausible-sounding explanations.** Always check and confirm.
7. **Do not make priority calls, that's user's role, this includes prioritising work, defects, plans.**
8. **Do not apply workarounds.** If something doesn't work, report it and wait for further instructions.

## Context

### What FABRIC is

FABRIC is a CI/CD pipeline tool that processes canonical model YAML files and generates TypeScript interfaces, Prisma schemas, OpenAPI specs, and rule stubs. It's published as `@pmcoe-ai1/fabric-cli` on GitHub Packages (npm.pkg.github.com).

Consumer projects use FABRIC by running `fabric init <project-name>` to scaffold a new project, then authoring their canonical model and running the pipeline (`validate → gate → codegen → tsc → jest`).

### What's broken

`lib/init.js` has 4 bugs that make the consumer project setup workflow broken out of the box. All 4 have been analysed with full upstream/downstream impact analysis and verified.

### Key files to read BEFORE writing any code

1. **Fix plan (read this first — it IS the specification):**
   `/Users/alan/Fabric-fixes/docs/phase4-fixes/init-bug-fix-plan.md`
   — Contains exact code changes (before/after), edge cases, verification steps, test specifications, and execution order for all 4 bugs.

2. **Current init.js (the code being fixed):**
   `/Users/alan/FABRIC/lib/init.js` (230 lines)

3. **Current tests (you'll modify this file):**
   `/Users/alan/FABRIC/tests/init.test.ts` (203 lines)

4. **Starter model template (you'll add {{DOMAIN}} placeholders):**
   `/Users/alan/FABRIC/init/starter.canonical-model.yaml`

5. **CI workflow template (you'll add {{DOMAIN}} placeholders + permissions block):**
   `/Users/alan/FABRIC/init/fabric-ci.yml`

6. **FABRIC's own .npmrc (reference for consistency):**
   `/Users/alan/FABRIC/.npmrc`

## The 4 Bugs

### INIT-01 (HIGH): Can't scaffold into existing directory

**File:** `lib/init.js:62-66`
**Problem:** `fabric init` rejects any existing directory. This blocks the standard workflow: `gh repo create --clone` then `fabric init .`
**Fix:** Replace hard rejection with a SAFE_EXISTING allowlist: `.git`, `.DS_Store`, `README.md`, `LICENSE`, `.gitignore`, `Thumbs.db`. Also add smart .gitignore append (preserves existing .gitignore, appends only missing FABRIC entries with line-by-line duplicate detection and negation-awareness).

### INIT-02 (CRITICAL): Missing .npmrc generation

**File:** `lib/init.js` (missing entirely)
**Problem:** `package.json` declares `@pmcoe-ai1/fabric-cli` as devDependency on GitHub Packages, but no `.npmrc` is generated. `npm install` fails with 404.
**Fix:** Generate `.npmrc` with `@pmcoe-ai1:registry=https://npm.pkg.github.com` and `${GITHUB_TOKEN}` variable reference. Also add `permissions: contents: read, packages: read` block to `init/fabric-ci.yml`.

### INIT-03 (LOW): Hardcoded `task-management` domain name

**File:** `lib/init.js:109`
**Problem:** `fabric.config.json` domain key is always `task-management` regardless of project name.
**Fix:** Sanitize project name to valid domain name (`lowercase → replace invalid chars → prefix leading digits → strip trailing hyphens → reject if < 3 chars`), use as config key. Add `{{DOMAIN}}` placeholders to starter model template.

### INIT-04 (LOW): Hardcoded model filename in npm scripts and CI

**File:** `lib/init.js:130-133`, `init/fabric-ci.yml:35,39,43,47`
**Problem:** npm scripts and CI workflow hardcode `models/starter.canonical-model.yaml`. If model is renamed (which INIT-03 fix does), everything breaks.
**Fix:** Merged with INIT-03. Model file renamed to `models/{domainName}.canonical-model.yaml`. npm scripts, CI workflow, and config all use the dynamic name. `{{DOMAIN}}` placeholders in template files replaced at init time.

## Execution Order

The fix plan specifies this order:

1. **INIT-01** (directory check + .gitignore append) — no dependencies
2. **INIT-02** (.npmrc generation + CI permissions) — no dependencies on INIT-01
3. **INIT-03 + INIT-04** (domain name + placeholders) — depends on INIT-01 completing first so tests can use clone-then-init workflow
4. **Update tests** — after all 3 fixes
5. **Run verification plan** — after all code changes
6. **Version bump and republish** — after verification passes

## Files to Modify

| File | Repo | Change |
|------|------|--------|
| `lib/init.js` | FABRIC | All 4 fixes (~50 lines changed/added) |
| `init/starter.canonical-model.yaml` | FABRIC | 4 lines: add `{{DOMAIN}}` placeholders |
| `init/fabric-ci.yml` | FABRIC | 4 lines: `{{DOMAIN}}` placeholders + `permissions:` block |
| `tests/init.test.ts` | FABRIC | ~60 lines: update existing tests + add new tests |
| `README.md` | FABRIC | 1 line: change `task-management` to `<your-project-name>` |

## Files NOT to Modify

- `lib/validate.js`, `lib/gate.js`, `lib/codegen.js` — pipeline tools, unrelated
- `schema/canonical-model.schema.json` — unrelated
- `files/*.canonical-model.yaml` — FABRIC's own example domains
- `generated/`, `generated-*` — codegen output
- `.github/workflows/*.yml` — FABRIC's own CI workflows
- `fabric.config.json` — FABRIC's own config

## Regression Tests Needed

### INIT-01 tests:

```
- scaffolds into existing empty directory → succeeds
- scaffolds into directory with only .git → succeeds
- scaffolds into directory with .git + README.md → succeeds
- scaffolds into directory with .git + README.md + LICENSE + .gitignore → succeeds
- rejects directory with package.json → exit code 1
- rejects directory with src/ → exit code 1
- preserves existing .gitignore content when appending FABRIC entries
- appends only missing FABRIC entries (no duplicates)
- respects negated entries (!*.filled.yaml) — does not re-add
- appends when .gitignore has commented-out entry (# *.filled.yaml)
- handles Windows CRLF in existing .gitignore
```

### INIT-02 tests:

```
- .npmrc is generated with GitHub Packages registry config
- .npmrc contains ${GITHUB_TOKEN} variable reference, not hardcoded tokens
- CI workflow has permissions block with contents: read and packages: read
```

### INIT-03 + INIT-04 tests:

```
- fabric.config.json domain key matches sanitized project name
- model file is named {domainName}.canonical-model.yaml
- model meta.domain matches sanitized project name
- no {{DOMAIN}} placeholders remain in generated files
- npm scripts reference correct model filename
- CI workflow references correct model filename
- sanitization: uppercase → lowercase
- sanitization: leading digit → x prefix
- sanitization: spaces → hyphens
- sanitization: project name < 3 chars after sanitize → rejected
- starter model passes validate.js after domain name injection
```

### Existing tests to update:

```
- line 56: expect model at 'models/starter.canonical-model.yaml' → dynamic name
- line 93-97: expect config key 'task-management' → dynamic name
- line 134-143: 'existing directory exits with code 1' → split into allow/reject tests
- line 164: expect model at 'models/starter.canonical-model.yaml' → dynamic name
```

## Verification Plan (run after all changes)

```bash
# 1. Unit tests pass
npx jest tests/init.test.ts --verbose

# 2. Fresh scaffold works
rm -rf /tmp/test-init-project
node bin/fabric init /tmp/test-init-project
cat /tmp/test-init-project/fabric.config.json
cat /tmp/test-init-project/.npmrc
cat /tmp/test-init-project/models/test-init-project.canonical-model.yaml | head -20
cat /tmp/test-init-project/.github/workflows/fabric.yml | grep canonical
cat /tmp/test-init-project/package.json | grep models

# 3. Clone-then-init works
mkdir /tmp/test-clone-init && cd /tmp/test-clone-init && git init
node /Users/alan/FABRIC/bin/fabric init .

# 4. Non-empty directory rejected
mkdir /tmp/test-nonempty && echo "file" > /tmp/test-nonempty/existing.txt
node /Users/alan/FABRIC/bin/fabric init /tmp/test-nonempty  # should fail

# 5. Short name rejected
node /Users/alan/FABRIC/bin/fabric init /tmp/ab  # should fail

# 6. npm install works (requires GITHUB_TOKEN)
cd /tmp/test-init-project
GITHUB_TOKEN=$(gh auth token) npm install

# 7. Pipeline runs in consumer project
npx fabric validate models/test-init-project.canonical-model.yaml
npx fabric codegen models/test-init-project.canonical-model.yaml

# 8. FABRIC's own tests still pass
cd /Users/alan/FABRIC
npx tsc --noEmit
npx jest

# 9. Template files still have placeholders
grep '{{DOMAIN}}' init/starter.canonical-model.yaml  # 4 matches
grep '{{DOMAIN}}' init/fabric-ci.yml  # 4 matches

# 10. Version bump + republish
npm version minor
GITHUB_TOKEN=$(gh auth token) npm publish
```

## What NOT to Do

- Do not apply workarounds — implement the fix plan exactly
- Do not skip the verification plan
- Do not modify canonical model files
- Do not modify generated/ directories
- Do not commit with failing tests
- Do not assume previous session state — read the files
