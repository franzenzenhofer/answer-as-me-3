# CLAUDE.md

> I am **Claude Code** (not Claude Desktop).  
> On every session start: **read & understand** this CLAUDE.md + `/Users/franzenzenhofer/.claude/CLAUDE.md` + `/Users/franzenzenhofer/CLAUDE.md`.

---

## 🎯 Project Goal

**THE MAIN GOAL**: Create a production-ready modular Google Apps Script Gmail add-on with TypeScript, demonstrating best practices in architecture, deployment, and testing.

### Project Identity
- **Name**: Answer As Me 3
- **Type**: Gmail Add-on (Google Apps Script)
- **Architecture**: Modular TypeScript with namespace pattern
- **Deployment**: Single-file bundle (Code.gs)

---

## 1️⃣ Root-Cause Problem Solving

* Ask **"Why?" × 7** → every answer becomes a **todo**
* Fix the **root cause**, not symptoms
* No mock/fallback/dummy data - **real implementations only**
* **Fail fast, loud, early** → investigate → permanent **KISS/DRY/CLEAN** fix
* Read every file before you change it. Understand every file before you write to it.

## 2️⃣ Task & Todo Management

### Before ANY action:
1. **Think** – goal, constraints, KISS/DRY, success criteria
2. **Todo** – create/update todo list with priorities
3. **Do** – implement with maintainable, debuggable code
4. **Test** – unit + integration + post-bundle validation
5. **Reflect** – refine, dedupe, simplify

### Task Requirements:
* One-day max scope, action-verb names
* Each task MUST have:
  - **QA task**: Verify implementation correctness
  - **Priority task**: Consider alternatives and sustainability
* Tag with **priority** (high/medium/low) and **effort**

## 3️⃣ Code Quality Standards

### Zero Tolerance:
* **0** failing tests, lints, TS errors, warnings
* **0** code smells or technical debt
* **100%** type safety (no `any` without explicit reason)

### Architecture Principles:
* **Modular**: Single responsibility per module
* **DRY**: > 10% duplication fails build
* **KISS**: ≤ 50 LOC per function
* **Pure functions** preferred
* **Immutable state** updates

### Module Structure:
```
src/
├── modules/         # TypeScript namespace modules
│   ├── config.ts    # Configuration constants
│   ├── logger.ts    # Structured logging (AppLogger)
│   ├── state.ts     # State management
│   ├── ui.ts        # CardService UI builders
│   └── error-handler.ts # Error handling
└── Code.ts          # Main entry point
```

## 4️⃣ Development Workflow

### Commands:
| Command | Action | Description |
|---------|--------|-------------|
| `npm run build` | Compile + Bundle | TypeScript → JS → Single Code.gs |
| `npm run watch` | Dev mode | Watch TypeScript files |
| `npm test` | Run tests | Jest with GAS mocks |
| `npm run lint` | Type check | `tsc --noEmit` |
| `npm run check` | Full validation | Lint + ESLint |
| `npm run deploy` | Production deploy | Full pipeline + version bump |
| `npm run deploy:major` | Major release | Major version bump |

### Build Pipeline:
1. **Clean**: Remove old dist files
2. **Compile**: TypeScript → JavaScript
3. **Bundle**: Combine modules with dependency resolution
4. **Validate**: Post-bundle syntax and content checks
5. **Version**: Inject version and timestamp

## 5️⃣ Deployment Protocol

### **CRITICAL**: Always run `npm run deploy` after changes!

The deployment process:
1. **Pre-deploy checks**: Lint, test, build
2. **Bundle creation**: Single Code.gs file
3. **Version management**: Auto version bump
4. **Push to GAS**: With auto-cleanup
5. **Verification**: Post-deploy validation

### Deployment Features:
* **Dry-run mode**: `./deploy.sh --dry-run`
* **Auto-cleanup**: Removes old deployments at limit
* **Single-file guarantee**: Only Code.gs + appsscript.json
* **Version injection**: `__VERSION__` and `__DEPLOY_TIME__` replaced

## 6️⃣ Testing Strategy

### Test Types:
* **Unit tests**: Module isolation (limited due to namespaces)
* **Post-bundle**: Validates final Code.gs structure
* **Integration**: Manual testing in Gmail

### Post-Bundle Validation:
* Bundle size check (min 5KB)
* Required functions present
* Required namespaces present
* Syntax validation with Acorn
* No CommonJS artifacts

## 7️⃣ Git & Version Control

### Every session:
```bash
git add -A
git commit -m "type: description"  # Conventional commits
git push
```

### Commit Types:
* `feat:` New features
* `fix:` Bug fixes
* `chore:` Maintenance
* `docs:` Documentation
* `test:` Test changes
* `refactor:` Code restructuring

## 8️⃣ Security & Safety

### File Protection:
* Files can ONLY be deleted with explicit `"DELETE"` command
* No destructive operations without confirmation
* Protect Franz Enzenhofer's data at all times

### Code Security:
* No hardcoded credentials
* Use PropertiesService for sensitive data
* Input validation on all user inputs
* Error messages don't expose internals

## 9️⃣ Module Guidelines

### Config Module:
* All constants and configuration
* Version placeholders for build-time injection
* Type-safe settings objects

### Logger Module (AppLogger):
* Structured logging with levels
* ISO timestamp format
* Optional data parameter
* Named `AppLogger` to avoid conflicts

### State Module:
* Centralized state management
* PropertiesService persistence
* Getter/setter pattern
* Immutable updates

### UI Module:
* Reusable CardService builders
* Consistent styling
* Type-safe component creation
* Error and loading states

### ErrorHandler Module:
* Typed error categories
* User-friendly messages
* Comprehensive logging
* Async wrapper functions

## 🔟 Production Checklist

Before deployment:
- [ ] All tests passing
- [ ] No lint errors or warnings
- [ ] Post-bundle validation successful
- [ ] Version bumped appropriately
- [ ] README.md updated if needed
- [ ] No console.log in production code
- [ ] Error handling comprehensive
- [ ] State persistence working

## 📚 Key Files

* **bundle.js**: Module bundling with dependency resolution
* **deploy.sh**: Robust deployment script
* **tests/scripts/test-post-bundle.js**: Bundle validation
* **sync-readme.js**: Keeps README in sync with config

## 🚨 Common Issues & Solutions

### TypeScript Namespace Conflicts:
* Solution: Rename conflicting namespaces (e.g., Logger → AppLogger)

### ESLint Parsing Errors:
* Add test files to `.eslintignore`
* Use separate tsconfig for tests

### Bundle Too Large:
* Check for duplicate code
* Ensure clean build before bundling
* Remove development artifacts

### Deployment Failures:
* Check clasp authentication
* Verify .clasp.json has correct scriptId
* Use --dry-run to test first

---

## 📋 Current Status

- ✅ Modular TypeScript architecture
- ✅ Complete build pipeline
- ✅ Testing infrastructure
- ✅ Deployment automation
- ✅ Error handling and logging
- ✅ State management
- ✅ UI component system
- ⏳ Awaiting clasp setup for deployment

---

### Mantra

**Quality is culture, not a gate.**

Every line of code should be production-ready, maintainable, and a joy to work with.

---

*Last Updated: 2025-08-07*