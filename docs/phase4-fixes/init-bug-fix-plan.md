# INIT Bug Fix Plan

## Operating Rules

1. **Be honest and detail-oriented.** Do not make assumptions. Always state facts and never present false information.
2. **Do not make priority calls or decide what's worth doing or not.** Present findings and options — decisions belong to the user.
3. **Do not defer any work.**
4. **When unsure about something, say so.** When something needs to be checked before answering, check it first.
5. **Never fabricate data to fill gaps in knowledge.** If you haven't read the code, say "I haven't checked this." Never present unverified information in tables, lists, or specific claims. Do the work first, then report.
6. **Do not fill in gaps in your knowledge with plausible-sounding explanations.** Always check and confirm.
7. **Do not make priority calls, that's user's role, this includes prioritising work, defects, plans.**
8. **Do not apply workarounds.** If something doesn't work, report it and wait for further instructions.

---

## Bugs Being Fixed

| Bug | Severity | Summary |
|-----|----------|---------|
| INIT-01 | HIGH | `fabric init` refuses to scaffold into an existing directory — blocks standard clone-then-init workflow |
| INIT-02 | CRITICAL | Missing `.npmrc` generation — `npm install` fails out of the box |
| INIT-03 | LOW | Hardcoded `task-management` domain name in config key and model `meta.domain` |
| INIT-04 | LOW | Hardcoded `models/starter.canonical-model.yaml` in npm scripts and CI workflow |

**Note:** INIT-03 and INIT-04 are merged into a single fix because renaming the model file (INIT-03) makes the hardcoded paths (INIT-04) point to a file that no longer exists. They cannot be fixed independently.

---

## Installation Method

Before any consumer project can use FABRIC, the user's machine needs access to the `@pmcoe-ai1` npm scope on GitHub Packages.

### Option 1: `npx @pmcoe-ai1/fabric-cli init <project-name>`

`npx` fetches the package from the registry on demand, runs it, then discards it. No permanent install.

**Requires:** `.npmrc` in the user's home directory (`~/.npmrc`) with the GitHub Packages registry config, because `npx` needs to know where to find `@pmcoe-ai1` packages before any project exists.

```bash
# One-time setup in ~/.npmrc
echo "@pmcoe-ai1:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=$(gh auth token)" >> ~/.npmrc

# Then anywhere:
npx @pmcoe-ai1/fabric-cli init my-project
```

**Pros:** Nothing installed globally. Always runs the latest published version.
**Cons:** Requires global `~/.npmrc` config. Slower — downloads the package every time. If the token in `~/.npmrc` expires, `npm install` fails with a clear 401 error (not silent).

---

## Scope

**Repository:** FABRIC (`pmcoe-ai1/FABRIC`)
**Files modified:** 5
**Files unchanged:** All pipeline tools (`lib/validate.js`, `lib/gate.js`, `lib/codegen.js`, etc.), all canonical models, all generated output, all tests except `tests/init.test.ts`

---

## Fix Plan — Detailed

### Fix 1: INIT-01 — Allow scaffolding into existing directories

**File:** `lib/init.js`
**Current behaviour (lines 62–66):**

```javascript
if (fs.existsSync(projectPath)) {
  console.error(`Error: directory already exists: ${projectPath}`);
  console.error('Choose a different path or remove the existing directory.');
  process.exit(1);
}
```

This blocks the standard workflow: `gh repo create --clone` then `fabric init`.

**Design reference:** create-react-app and create-next-app both use a safe-file allowlist for existing directories. cargo init uses smart append with duplicate detection for .gitignore. This fix follows the same patterns.

#### Part A: Directory allowlist

**New behaviour:** Replace the exists-and-exit check with a safe-file allowlist. Files commonly produced by `gh repo create --clone` (with `--add-readme`, `--license`, `--gitignore` flags) are allowed. Anything else is rejected.

```javascript
const SAFE_EXISTING = new Set(['.git', '.DS_Store', 'README.md', 'LICENSE', '.gitignore', 'Thumbs.db']);

if (fs.existsSync(projectPath)) {
  const entries = fs.readdirSync(projectPath).filter(e => !SAFE_EXISTING.has(e));
  if (entries.length > 0) {
    console.error(`Error: directory already exists and contains unexpected files: ${projectPath}`);
    console.error(`  Found: ${entries.join(', ')}`);
    console.error('Only these files are allowed in an existing directory:');
    console.error(`  ${[...SAFE_EXISTING].join(', ')}`);
    process.exit(1);
  }
}
```

**Allowlist verification:** Each entry was verified by running `gh repo create` with all flag combinations:

| `gh repo create` flags | Files produced | All in safe list? |
|------------------------|---------------|--------------------|
| (none) | `.git/` only | ✓ |
| `--add-readme` | `.git/`, `README.md` | ✓ |
| `--license mit` | `.git/`, `LICENSE` | ✓ |
| `--gitignore Node` | `.git/`, `.gitignore` | ✓ |
| `--add-readme --license mit --gitignore Node` | `.git/`, `README.md`, `LICENSE`, `.gitignore` | ✓ |

**Excluded from allowlist (verified):**
- `.gitattributes` — GitHub does NOT auto-generate this file with any `gh repo create` flag combination. Verified by creating a repo with `--add-readme --license mit --gitignore Node` and listing all files.

**Template repos (`--template`):** Not covered by the allowlist. Template repos can contain any files — unbounded. The allowlist will correctly reject these, which is the right behavior since template files would conflict with FABRIC's scaffold.

**What this allows:**
- `gh repo create --clone` then `fabric init .` — standard workflow
- `gh repo create --clone --add-readme --license mit --gitignore Node` then `fabric init .` — maximum auto-generated files
- `mkdir my-project && git init && fabric init .` — manual git init
- `fabric init my-project` where `my-project/` is empty

**What this still rejects:**
- Directories with `package.json`, `src/`, `node_modules/`, or any file not in the safe list

**Downstream impact on directory creation:** None. The `fs.mkdirSync(fullPath, { recursive: true })` on line 84 is a no-op for directories that already exist.

**Downstream impact on file writes:** All `writeFileSync` and `copyFileSync` calls create new files that don't exist in the safe list — with one exception: `.gitignore`. See Part B.

#### Part B: Smart .gitignore append

**Problem:** `gh repo create --gitignore Node` creates a 139-line `.gitignore` with comprehensive Node.js patterns. The current `init.js` line 213 uses `writeFileSync` which silently overwrites it with FABRIC's 7-line version, destroying 132 useful entries.

**Design reference:** create-react-app uses `fs.appendFileSync()`. cargo init uses smart append with duplicate detection and commenting. This fix uses line-by-line duplicate detection (cargo init pattern) with negation-awareness.

**New behaviour (replaces lines 203–213):**

```javascript
const fabricIgnoreEntries = [
  '*.filled.yaml',
  'signals.json',
  'confidence-scores.json',
];

const defaultIgnore = `node_modules/
dist/
*.filled.yaml
signals.json
confidence-scores.json
.env
.DS_Store
`;

const gitignorePath = path.join(projectPath, '.gitignore');

if (fs.existsSync(gitignorePath)) {
  const existing = fs.readFileSync(gitignorePath, 'utf8');
  const existingLines = existing.split('\n').map(l => l.trim());
  const missing = fabricIgnoreEntries.filter(entry => {
    // Already present as active entry
    if (existingLines.includes(entry)) return false;
    // User explicitly negated it — respect their choice
    if (existingLines.includes('!' + entry)) return false;
    // Not present or only commented out — append it
    return true;
  });
  if (missing.length > 0) {
    fs.appendFileSync(gitignorePath, `\n# Added by fabric init\n${missing.join('\n')}\n`);
  }
} else {
  fs.writeFileSync(gitignorePath, defaultIgnore);
}
```

**Duplicate detection — verified edge cases:**

| Existing .gitignore content | Entry being checked | Detected? | Appended? | Correct? |
|-----------------------------|--------------------:|:---------:|:---------:|:--------:|
| `*.filled.yaml` | `*.filled.yaml` | ✓ active | No | ✓ |
| `# *.filled.yaml` | `*.filled.yaml` | ✗ commented | Yes | ✓ — comment means it's not active |
| `!*.filled.yaml` | `*.filled.yaml` | ✓ negated | No | ✓ — respects user's explicit un-ignore |
| `*.yaml` | `*.filled.yaml` | ✗ different pattern | Yes | ✓ — different gitignore patterns |
| `build/*.filled.yaml` | `*.filled.yaml` | ✗ path-qualified | Yes | ✓ — different scope |
| `*.filled.yaml   ` | `*.filled.yaml` | ✓ after trim | No | ✓ — whitespace handled |
| `  *.filled.yaml` | `*.filled.yaml` | ✓ after trim | No | ✓ — indentation handled |

**Windows CRLF handling:** `trim()` strips `\r`, so Windows-edited .gitignore files are handled correctly.

**Newline before append:** The appended block starts with `\n`. If the existing file ends with a newline (standard), this produces a blank line before the header — cosmetic only. If the existing file doesn't end with a newline, the `\n` provides correct separation.

**What the user gets:**

| Scenario | .gitignore result |
|----------|-------------------|
| No existing .gitignore | Full 7-line default written |
| GitHub's 139-line Node template | Preserved, 3 FABRIC entries appended with header |
| Custom .gitignore with `*.filled.yaml` already present | Only missing entries appended |
| Custom .gitignore with `!*.filled.yaml` (negated) | Negation respected, entry not re-added |
| Run `fabric init` twice (blocked by Part A, but if somehow reached) | Duplicate detection prevents re-appending |

**`fabric init .` support:** `path.resolve('.')` resolves to the current working directory. `path.basename()` gives the directory name. Both already work — no change needed.

---

### Fix 2: INIT-02 — Generate `.npmrc`

**File:** `lib/init.js`
**Current behaviour:** No `.npmrc` generated. `package.json` declares `@pmcoe-ai1/fabric-cli` as a devDependency, hosted on GitHub Packages (`npm.pkg.github.com`). `npm install` fails with 404 because npm looks on npmjs.com by default.

**Root cause:** `init.js` generates `package.json` with the dependency but not the registry config needed to resolve it.

#### Part A: `.npmrc` generation

**New behaviour:** Add `.npmrc` generation in `init.js` after `.gitignore` handling:

```javascript
// ── Generate .npmrc ─────────────────────────────────────────────────────────
const npmrc = `# Registry config for @pmcoe-ai1 packages (GitHub Packages)
# Requires GITHUB_TOKEN environment variable to be set
# Safe to commit — contains no secrets, only a variable reference
@pmcoe-ai1:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=\${GITHUB_TOKEN}
`;

fs.writeFileSync(path.join(projectPath, '.npmrc'), npmrc);
```

**Token handling:** Uses `${GITHUB_TOKEN}` environment variable reference — not a hardcoded token. npm expands `${VARIABLE_NAME}` in `.npmrc` at runtime. If the variable is not set, npm replaces it with empty string, which results in a clear 401 from GitHub Packages.

**Consistency check:** FABRIC's own `.npmrc` at the repo root uses the identical format:
```
@pmcoe-ai1:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```
The generated `.npmrc` matches exactly (plus comments).

#### Part B: CI workflow template — `permissions:` block

**File:** `init/fabric-ci.yml`
**Problem discovered during impact analysis:** Once `.npmrc` exists and points to GitHub Packages, `npm ci` in GitHub Actions needs `GITHUB_TOKEN` with `packages: read` permission. GitHub Actions automatically exports `GITHUB_TOKEN` as an env var, but its permissions depend on the repository's settings:

- Default for new repos: `contents: read` + `packages: read` — works
- If the org restricts default token permissions to `contents: read` only — `npm ci` fails with 401

**Fix:** Add a `permissions:` block to the CI workflow template so it explicitly requests what it needs:

**Current (lines 7–14):**
```yaml
name: FABRIC Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
```

**New:**
```yaml
name: FABRIC Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  packages: read

env:
  NODE_VERSION: '20'
```

This is defensive — works in both permissive and restrictive orgs.

#### Upstream impact

None. No existing code in `init.js` references `.npmrc`. This adds a new `writeFileSync` call — no existing code path is modified.

#### Downstream impact — verified

| # | Check | Result | Action |
|---|-------|--------|--------|
| 1 | CI workflow `permissions:` block | `npm ci` may fail with 401 in restrictive orgs without `packages: read` | **Fix in Part B above** |
| 2 | Forked repos (cross-org) | `GITHUB_TOKEN` scoped to fork's org, can't read `pmcoe-ai1` packages. 401 failure. | Known GitHub Packages limitation — fork must use a PAT with `read:packages` for `pmcoe-ai1` |
| 3 | Local dev without `GITHUB_TOKEN` | npm expands `${GITHUB_TOKEN}` to empty string → sends empty auth → GitHub Packages returns 401 Unauthorized. Error message: `npm error 401 Unauthorized - GET https://npm.pkg.github.com/@pmcoe-ai1%2ffabric-cli`. Clear, not silent. | No action — failure is obvious |
| 4 | `.gitignore` interaction | `.npmrc` not excluded by FABRIC's generated `.gitignore` or GitHub's Node template (verified via `gh api /gitignore/templates/Node`). `.npmrc` will be committed to git — intentional, contains no secrets. | No action |
| 5 | `SAFE_EXISTING` interaction (INIT-01) | `.npmrc` NOT in the allowlist. Directory containing `.npmrc` is rejected by INIT-01 check. Correct — existing `.npmrc` indicates previously-scaffolded project. | No action |
| 6 | `npm ci` vs `npm install` | Both read `.npmrc` identically for registry config. No difference in auth behavior. | No action |
| 7 | `package-lock.json` registry URL | Lockfile will encode `https://npm.pkg.github.com/download/@pmcoe-ai1/fabric-cli/...` as the resolved URL. Not a secret — it's the registry endpoint. Anyone running `npm ci` still needs auth via `.npmrc` + `GITHUB_TOKEN`. | No action |
| 8 | Yarn Classic (v1) | Reads `.npmrc` — works. Honors `authToken` entries. | No action |
| 9 | Yarn Berry (v2+) | Does NOT read `.npmrc`. Uses `.yarnrc.yml` with `npmRegistries` config. `yarn install` would fail to resolve `@pmcoe-ai1/fabric-cli`. FABRIC scaffolds for npm (generates `package-lock.json`). Yarn Berry users would need to create their own `.yarnrc.yml`. | Documented limitation — FABRIC targets npm |
| 10 | pnpm | Reads `.npmrc` — same format as npm. Works. | No action |
| 11 | Dependabot (same org) | Uses `GITHUB_TOKEN` automatically. Consumer repo in `pmcoe-ai1` → `GITHUB_TOKEN` has `read:packages` for `pmcoe-ai1`. Works out of the box. | No action |
| 12 | Dependabot (cross-org) | Fork's `GITHUB_TOKEN` scoped to fork's org. Needs `dependabot/secrets` with a PAT that has `read:packages` for `pmcoe-ai1`. | Same as forked repos limitation |
| 13 | Renovate | Reads `.npmrc` but may not have `GITHUB_TOKEN` in its execution environment. Needs manual `hostRules` config in `renovate.json` for GitHub Packages auth. | Documented limitation — manual Renovate config required if used |
| 14 | Existing tests | No test references `.npmrc` — none break. | New test needed (see below) |

#### Tests

**No existing tests break.**

**New tests needed:**

```typescript
test('.npmrc is generated with GitHub Packages config', () => {
  const dir = tmpDir();
  testDirs.push(dir);
  runInit(dir);
  const npmrcPath = path.join(dir, '.npmrc');
  expect(fs.existsSync(npmrcPath)).toBe(true);
  const content = fs.readFileSync(npmrcPath, 'utf8');
  expect(content).toContain('@pmcoe-ai1:registry=https://npm.pkg.github.com');
  expect(content).toContain('${GITHUB_TOKEN}');
  expect(content).not.toContain('ghp_');  // no hardcoded tokens
  expect(content).not.toContain('gho_');  // no OAuth tokens
});

test('CI workflow has permissions block with packages:read', () => {
  const dir = tmpDir();
  testDirs.push(dir);
  runInit(dir);
  const ciPath = path.join(dir, '.github', 'workflows', 'fabric.yml');
  const yaml = require('js-yaml');
  const ci = yaml.load(fs.readFileSync(ciPath, 'utf8'));
  expect(ci.permissions).toBeDefined();
  expect(ci.permissions.contents).toBe('read');
  expect(ci.permissions.packages).toBe('read');
});
```

#### Files changed

| File | Repo | Change |
|------|------|--------|
| `lib/init.js` | FABRIC | Add `.npmrc` generation (~8 lines) |
| `init/fabric-ci.yml` | FABRIC | Add `permissions:` block (~3 lines) |
| `tests/init.test.ts` | FABRIC | Add 2 new tests (~15 lines) |

#### Files NOT changed

| File | Why |
|------|-----|
| `lib/validate.js`, `lib/gate.js`, `lib/codegen.js` | No registry references in pipeline tools |
| `schema/canonical-model.schema.json` | Unrelated |
| `files/*.canonical-model.yaml` | Unrelated |
| `generated/`, `generated-*` | Unrelated |
| `.github/workflows/*.yml` | FABRIC's own CI — already has `.npmrc` |
| `package.json` | Already declares `@pmcoe-ai1/fabric-cli` — no change needed |

#### Execution order

INIT-02 has no dependency on INIT-01 or INIT-03/04. It can be implemented independently. However, if INIT-01 is implemented first, the `.npmrc` test can use the clone-then-init workflow for additional coverage.

---

### Fix 3: INIT-03 + INIT-04 — Dynamic domain name and model filename

These two bugs are fixed together because the model file rename (INIT-03) makes the hardcoded paths (INIT-04) dependent on the domain name.

#### Step 3a: Add domain name sanitization

**File:** `lib/init.js`
**Location:** After line 59 (`const projectName = path.basename(projectPath)`)

```javascript
// ── Sanitize domain name ────────────────────────────────────────────────────
// Schema ID pattern: ^[a-z][a-z0-9_-]*$
const domainName = projectName
  .toLowerCase()
  .replace(/[^a-z0-9_-]/g, '-')
  .replace(/^[^a-z]/, 'x')
  .replace(/-+$/, '');

if (!domainName || domainName.length < 3) {
  console.error(`Error: project name "${projectName}" produces a domain name too short ("${domainName}").`);
  console.error('Domain names must be at least 3 characters. Choose a more descriptive name.');
  process.exit(1);
}
```

**Sanitization rules:**
| Input | Output | Rule applied |
|-------|--------|-------------|
| `my-project` | `my-project` | None needed |
| `My-Project` | `my-project` | Lowercase |
| `123app` | `x23app` | Leading digit → `x` prefix |
| `has spaces` | `has-spaces` | Invalid chars → hyphens |
| `foo_bar` | `foo_bar` | Underscores preserved (allowed by schema) |
| `Fabric-fixes` | `fabric-fixes` | Lowercase |
| `---` | rejected | Too short after sanitization (1 char) |
| `ab` | rejected | Too short (2 chars) |

**Minimum length 3:** Anything shorter is not a meaningful domain name. Prevents degenerate inputs like `---` → `x`.

#### Step 3b: Add `{{DOMAIN}}` placeholders to template files

**File:** `init/starter.canonical-model.yaml`

4 lines change:
- Line 3: `# CANONICAL MODEL — starter (task management)` → `# CANONICAL MODEL — {{DOMAIN}}`
- Line 6: `# Domain: task-management` → `# Domain: {{DOMAIN}}`
- Line 19: `description: "Task management domain — minimal starter model generated by fabric init."` → `description: "{{DOMAIN}} domain — starter model generated by fabric init."`
- Line 20: `domain: "task-management"` → `domain: "{{DOMAIN}}"`

**Why `{{DOMAIN}}`:**
- Cannot appear in real YAML content — no accidental matches
- Template file stays valid YAML (the value is the string `"{{DOMAIN}}"`)
- Self-documenting — obviously a placeholder
- Simple regex replacement — no YAML parser needed, no comment/formatting loss

**File:** `init/fabric-ci.yml`

4 lines change:
- Line 35: `npx fabric validate models/starter.canonical-model.yaml` → `npx fabric validate models/{{DOMAIN}}.canonical-model.yaml`
- Line 39: `npx fabric template-gen models/starter.canonical-model.yaml --output-dir ./templates` → `npx fabric template-gen models/{{DOMAIN}}.canonical-model.yaml --output-dir ./templates`
- Line 43: `npx fabric gate --model models/starter.canonical-model.yaml` → `npx fabric gate --model models/{{DOMAIN}}.canonical-model.yaml`
- Line 47: `npx fabric codegen models/starter.canonical-model.yaml` → `npx fabric codegen models/{{DOMAIN}}.canonical-model.yaml`

#### Step 3c: Update `init.js` to use placeholders

**Model file copy (replaces lines 96–103):**

```javascript
const starterModelSrc = path.join(initDir, 'starter.canonical-model.yaml');
const modelFileName = `${domainName}.canonical-model.yaml`;
const starterModelDest = path.join(projectPath, 'models', modelFileName);

if (!fs.existsSync(starterModelSrc)) {
  console.error(`Error: starter model not found at: ${starterModelSrc}`);
  process.exit(2);
}

let modelContent = fs.readFileSync(starterModelSrc, 'utf8');
modelContent = modelContent.replace(/\{\{DOMAIN\}\}/g, domainName);
fs.writeFileSync(starterModelDest, modelContent);
```

**Config generation (replaces lines 106–121):**

```javascript
const config = {
  version: '1.0.0',
  domains: {
    [domainName]: {
      model: `models/${modelFileName}`,
      outputDir: 'generated',
      filledDir: 'templates',
      rulesDir: 'src/rules',
    },
  },
};

fs.writeFileSync(
  path.join(projectPath, 'fabric.config.json'),
  JSON.stringify(config, null, 2) + '\n'
);
```

**Package.json scripts (replaces lines 129–134):**

```javascript
scripts: {
  validate: `npx fabric validate models/${modelFileName}`,
  codegen: `npx fabric codegen models/${modelFileName}`,
  gate: `npx fabric gate --model models/${modelFileName}`,
  test: 'jest',
  typecheck: 'tsc --noEmit',
},
```

**CI workflow copy (replaces lines 216–220):**

```javascript
const ciTemplateSrc = path.join(initDir, 'fabric-ci.yml');
const ciTemplateDest = path.join(projectPath, '.github', 'workflows', 'fabric.yml');
if (fs.existsSync(ciTemplateSrc)) {
  let ciContent = fs.readFileSync(ciTemplateSrc, 'utf8');
  ciContent = ciContent.replace(/\{\{DOMAIN\}\}/g, domainName);
  fs.writeFileSync(ciTemplateDest, ciContent);
}
```

#### Step 3d: Update tests

**File:** `tests/init.test.ts`

**Config key tests (lines 93–97):** Replace hardcoded `task-management` with dynamic check:

```typescript
const domainNames = Object.keys(config.domains);
expect(domainNames).toHaveLength(1);
const expectedDomain = path.basename(dir)
  .toLowerCase()
  .replace(/[^a-z0-9_-]/g, '-')
  .replace(/^[^a-z]/, 'x')
  .replace(/-+$/, '');
expect(domainNames[0]).toBe(expectedDomain);
const domain = config.domains[domainNames[0]];
expect(domain.model).toBe(`models/${expectedDomain}.canonical-model.yaml`);
expect(domain.outputDir).toBe('generated');
expect(domain.filledDir).toBe('templates');
expect(domain.rulesDir).toBe('src/rules');
```

**Model file tests:** Add check that model file is named `{domain}.canonical-model.yaml` and that `meta.domain` inside matches the domain name:

```typescript
const modelPath = path.join(dir, 'models', `${expectedDomain}.canonical-model.yaml`);
expect(fs.existsSync(modelPath)).toBe(true);
const modelContent = fs.readFileSync(modelPath, 'utf8');
expect(modelContent).toContain(`domain: "${expectedDomain}"`);
expect(modelContent).not.toContain('{{DOMAIN}}');
```

**CI workflow tests:** Add check that generated CI workflow references the correct model path:

```typescript
const ciPath = path.join(dir, '.github', 'workflows', 'fabric.yml');
expect(fs.existsSync(ciPath)).toBe(true);
const ciContent = fs.readFileSync(ciPath, 'utf8');
expect(ciContent).toContain(`models/${expectedDomain}.canonical-model.yaml`);
expect(ciContent).not.toContain('{{DOMAIN}}');
expect(ciContent).not.toContain('starter.canonical-model.yaml');
```

**.npmrc tests:** Add check that `.npmrc` is generated:

```typescript
const npmrcPath = path.join(dir, '.npmrc');
expect(fs.existsSync(npmrcPath)).toBe(true);
const npmrcContent = fs.readFileSync(npmrcPath, 'utf8');
expect(npmrcContent).toContain('@pmcoe-ai1:registry=https://npm.pkg.github.com');
expect(npmrcContent).toContain('${GITHUB_TOKEN}');
```

**Existing directory test (line 134–143):** Update to test the new behaviour — existing empty directory or git-only directory should succeed:

```typescript
it('scaffolds into an existing empty directory', () => {
  const dir = path.join(os.tmpdir(), `fabric-init-test-${Date.now()}`);
  fs.mkdirSync(dir);
  execSync(`node ${initScript} ${dir}`, { stdio: 'pipe' });
  expect(fs.existsSync(path.join(dir, 'fabric.config.json'))).toBe(true);
  fs.rmSync(dir, { recursive: true, force: true });
});

it('scaffolds into an existing git-only directory', () => {
  const dir = path.join(os.tmpdir(), `fabric-init-test-${Date.now()}`);
  fs.mkdirSync(dir);
  fs.mkdirSync(path.join(dir, '.git'));
  execSync(`node ${initScript} ${dir}`, { stdio: 'pipe' });
  expect(fs.existsSync(path.join(dir, 'fabric.config.json'))).toBe(true);
  fs.rmSync(dir, { recursive: true, force: true });
});

it('rejects existing non-empty directory', () => {
  const dir = path.join(os.tmpdir(), `fabric-init-test-${Date.now()}`);
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'existing.txt'), 'content');
  expect(() => {
    execSync(`node ${initScript} ${dir}`, { stdio: 'pipe' });
  }).toThrow();
  fs.rmSync(dir, { recursive: true, force: true });
});
```

**Sanitization edge case tests:** Add test for minimum length rejection:

```typescript
it('rejects project names that sanitize to fewer than 3 characters', () => {
  const dir = path.join(os.tmpdir(), '--');
  expect(() => {
    execSync(`node ${initScript} ${dir}`, { stdio: 'pipe' });
  }).toThrow();
});
```

#### Step 3e: Update README.md

**Line 85:** Change `"task-management"` to `"<your-project-name>"` in the example `fabric.config.json` snippet.

---

## File Change Summary

| # | File | Repo | Change Type | Lines Changed |
|---|------|------|-------------|---------------|
| 1 | `lib/init.js` | FABRIC | Modified | ~30 lines changed/added |
| 2 | `init/starter.canonical-model.yaml` | FABRIC | Modified | 4 lines (placeholders) |
| 3 | `init/fabric-ci.yml` | FABRIC | Modified | 4 lines (placeholders) |
| 4 | `tests/init.test.ts` | FABRIC | Modified | ~40 lines changed/added |
| 5 | `README.md` | FABRIC | Modified | 1 line |

---

## Files NOT Changed

- `lib/validate.js` — reads model path from CLI arg, no hardcoded filenames
- `lib/gate.js` — reads model path from `--model` arg, no hardcoded filenames
- `lib/codegen.js` — reads model path from CLI arg, uses `path.basename()` only for comment headers (cosmetic)
- `lib/config-reader.js` — reads `fabric.config.json` and returns domain config, iterates by key name
- `schema/canonical-model.schema.json` — unchanged, ID pattern already accommodates sanitized names
- `files/*.canonical-model.yaml` — FABRIC's own example domains, not affected
- `generated*/` — not affected
- `fabric.config.json` — FABRIC's own config, not affected
- `.github/workflows/` — FABRIC's own CI workflows, not affected

---

## Verification Plan

After implementing all fixes:

### 1. Unit tests pass

```bash
npx jest tests/init.test.ts --verbose
```

Expected: All existing tests pass with updated expectations, new tests pass.

### 2. Fresh scaffold works end-to-end

```bash
# Clean test
rm -rf /tmp/test-init-project
fabric init /tmp/test-init-project

# Verify structure
cat /tmp/test-init-project/fabric.config.json
# Expected: domain key is "test-init-project"

cat /tmp/test-init-project/models/test-init-project.canonical-model.yaml | head -20
# Expected: domain: "test-init-project", no {{DOMAIN}} placeholders

cat /tmp/test-init-project/.npmrc
# Expected: @pmcoe-ai1:registry=https://npm.pkg.github.com

cat /tmp/test-init-project/.github/workflows/fabric.yml | grep canonical
# Expected: models/test-init-project.canonical-model.yaml on all 4 lines

cat /tmp/test-init-project/package.json | grep models
# Expected: models/test-init-project.canonical-model.yaml in scripts
```

### 3. Clone-then-init workflow works

```bash
mkdir /tmp/test-clone-init
cd /tmp/test-clone-init
git init
fabric init .
# Expected: succeeds, uses "test-clone-init" as domain name
```

### 4. Non-empty directory rejected

```bash
mkdir /tmp/test-nonempty
echo "file" > /tmp/test-nonempty/existing.txt
fabric init /tmp/test-nonempty
# Expected: error about non-empty directory
```

### 5. Short name rejected

```bash
fabric init /tmp/ab
# Expected: error about domain name too short
```

### 6. npm install works

```bash
cd /tmp/test-init-project
GITHUB_TOKEN=$(gh auth token) npm install
# Expected: resolves @pmcoe-ai1/fabric-cli from GitHub Packages
```

### 7. Pipeline runs in consumer project

```bash
cd /tmp/test-init-project
npx fabric validate models/test-init-project.canonical-model.yaml
npx fabric codegen models/test-init-project.canonical-model.yaml
npx tsc --noEmit
npx jest
# Expected: all pass
```

### 8. FABRIC's own tests still pass

```bash
cd /Users/alan/FABRIC
npx tsc --noEmit
npx jest
# Expected: all pass — init changes don't affect pipeline tools
```

### 9. Template files still have placeholders

```bash
grep '{{DOMAIN}}' init/starter.canonical-model.yaml
# Expected: 4 matches

grep '{{DOMAIN}}' init/fabric-ci.yml
# Expected: 4 matches
```

### 10. Published package version bump

After all fixes are verified, bump version in `package.json` from `1.0.0` to `1.1.0` and republish:

```bash
npm version minor
GITHUB_TOKEN=$(gh auth token) npm publish
```

Consumer projects using `@pmcoe-ai1/fabric-cli: "*"` will pick up the new version on next `npm install`.

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Sanitization produces unexpected domain names | Edge case tests cover uppercase, digits, spaces, special chars, short names. Minimum length 3 rejects degenerate inputs. |
| `{{DOMAIN}}` appears in user-authored YAML content | Impossible — `{{DOMAIN}}` is not a valid YAML value in any FABRIC context. The schema's ID pattern `^[a-z][a-z0-9_-]*$` would reject it. |
| Existing `fabric init` users have projects with `task-management` and `starter.canonical-model.yaml` | Existing projects are unaffected. The fix only changes what `fabric init` produces for NEW projects. Old projects keep their current filenames. |
| CI workflow template path change breaks existing consumer project CI | Existing consumer projects already have their `.github/workflows/fabric.yml` committed. The template change only affects new `fabric init` runs. |
| `README.md` example no longer matches existing projects | README shows `<your-project-name>` which is generic. Existing projects can update their readme if desired. |
| Version bump from 1.0.0 to 1.1.0 breaks `*` version selector | `*` matches any version, including 1.1.0. No breaking change. |

---

## Execution Order

1. Fix INIT-01 (directory check) — no dependencies
2. Fix INIT-02 (`.npmrc` generation) — no dependencies
3. Fix INIT-03 + INIT-04 (domain name + placeholders) — depends on INIT-01 completing first so tests can use the clone-then-init workflow
4. Update tests — after all 3 fixes
5. Run verification plan — after all code changes
6. Version bump and republish — after verification passes
