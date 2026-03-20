# Handover Prompt: Initialize CMS Consumer Project

Copy everything below this line into a new Claude Code session.

---

## Task

Initialize a new FABRIC consumer project called "CMS" and verify the full pipeline works end-to-end.

## Working directory

Start from: /Users/alan/FABRIC

## Operating Rules

1. Be honest and detail-oriented. Do not make assumptions.
2. Do not make priority calls — decisions belong to the user.
3. Do not defer any work.
4. When unsure, say so. Check before answering.
5. Never fabricate data.
6. Do not apply workarounds. If something doesn't work, report and wait.

## Prerequisites already completed

- `@pmcoe-ai1/fabric-cli` v1.0.0 published to GitHub Packages (npm.pkg.github.com)
- `~/.npmrc` configured with `@pmcoe-ai1` registry pointing to GitHub Packages
- INIT bugs (01-04) fixed in `lib/init.js`, 21 regression tests passing
- Fixes include: SAFE_EXISTING allowlist, smart .gitignore append, .npmrc generation, CI permissions block, domain name sanitization, `{{DOMAIN}}` template placeholders

## Context

### What is FABRIC

FABRIC is a CI/CD pipeline tool published as `@pmcoe-ai1/fabric-cli`. Consumer projects use it by running `fabric init` to scaffold, then authoring canonical models and running the pipeline (validate → gate → codegen → tsc → jest).

### What is a consumer project

A separate Git repo that depends on `@pmcoe-ai1/fabric-cli`. It contains the domain-specific canonical model, rule implementations, and tests. FABRIC is the tool — the consumer project is the thing the tool processes.

### What happened to Fabric-fixes

There is an existing repo at `pmcoe-ai1/Fabric-fixes` and a local directory at `/Users/alan/Fabric-fixes`. These contain stale files from a previous session where `fabric init` was broken. The new CMS repo replaces this — it is a clean initialization using the fixed `init.js`.

## Steps

### 1. Backup docs from old Fabric-fixes

The old Fabric-fixes repo has analysis documents that must not be lost:

```bash
mkdir -p /tmp/fabric-fixes-docs-backup
cp -r /Users/alan/Fabric-fixes/docs/ /tmp/fabric-fixes-docs-backup/ 2>/dev/null
```

Check what was saved:
```bash
ls -la /tmp/fabric-fixes-docs-backup/phase4-fixes/
```

Expected files:
- `init-bug-fix-plan.md` — comprehensive fix plan for INIT-01 through INIT-04
- `INIT-FIX-HANDOVER.md` — handover prompt for the fix session
- `CMS-INIT-HANDOVER.md` — this file
- `initialisation-steps.md` — consumer project init documentation

### 2. Create the CMS repo

```bash
gh repo create pmcoe-ai1/CMS --private --clone
cd /Users/alan/CMS
```

### 3. Scaffold with fabric init

```bash
node /Users/alan/FABRIC/bin/fabric init .
```

Expected output:
```
✓ FABRIC project created at /Users/alan/CMS
```

### 4. Verify scaffold output

Check every generated file:

```bash
# Domain key should be "cms"
cat fabric.config.json

# Model file should be models/cms.canonical-model.yaml
ls models/

# meta.domain should be "cms"
head -25 models/cms.canonical-model.yaml

# .npmrc should exist with GitHub Packages config
cat .npmrc

# CI workflow should have permissions block and correct model paths
head -20 .github/workflows/fabric.yml
grep 'canonical-model' .github/workflows/fabric.yml

# npm scripts should reference cms.canonical-model.yaml
node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log(JSON.stringify(p.scripts, null, 2))"

# No {{DOMAIN}} placeholders remaining
grep -r '{{DOMAIN}}' . 2>&1
```

### 5. Install dependencies

```bash
GITHUB_TOKEN=$(gh auth token) npm install
```

Expected: resolves `@pmcoe-ai1/fabric-cli` from GitHub Packages without error.

### 6. Run the full pipeline

```bash
npx fabric validate models/cms.canonical-model.yaml
npx fabric codegen models/cms.canonical-model.yaml
npm run typecheck
npm test
```

All four should pass.

### 7. Copy docs from backup

```bash
mkdir -p docs/phase4-fixes
cp -r /tmp/fabric-fixes-docs-backup/phase4-fixes/* docs/phase4-fixes/
```

### 8. Commit and push

```bash
git add .
git commit -m "Initial scaffold via fabric init"
git push origin main
```

### 9. Verify CI

```bash
gh run list --limit 1
```

Check that the FABRIC Pipeline workflow triggered and runs `npm ci` successfully (requires `GITHUB_TOKEN` with `packages: read` — the `permissions:` block in the workflow handles this).

## Verification checklist

- [ ] `fabric.config.json` domain key is `cms`
- [ ] Model file is `models/cms.canonical-model.yaml`
- [ ] `meta.domain` inside model is `cms`
- [ ] `.npmrc` exists with `@pmcoe-ai1:registry=https://npm.pkg.github.com` and `${GITHUB_TOKEN}`
- [ ] `.github/workflows/fabric.yml` has `permissions: contents: read, packages: read`
- [ ] `.github/workflows/fabric.yml` references `models/cms.canonical-model.yaml` on all 4 pipeline steps
- [ ] `package.json` scripts reference `models/cms.canonical-model.yaml`
- [ ] No `{{DOMAIN}}` placeholders in any generated file
- [ ] `npm install` resolves `@pmcoe-ai1/fabric-cli` from GitHub Packages
- [ ] `npx fabric validate` passes
- [ ] `npx fabric codegen` produces output in `generated/`
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (or no tests yet — that's expected for a fresh scaffold)
- [ ] `git push` triggers CI workflow
- [ ] CI workflow `npm ci` step passes (not 401)
- [ ] Docs from old Fabric-fixes are preserved in `docs/phase4-fixes/`

## What NOT to do

- Do not modify anything in the FABRIC repo — work only in CMS
- Do not apply workarounds if something fails — report it
- Do not skip verification steps
- Do not commit without verifying the checklist
