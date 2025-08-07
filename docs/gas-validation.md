# Google Apps Script Validation Tools

This document describes the custom GAS validation tools created for Answer As Me 3.

## Overview

Google Apps Script has specific limitations and requirements that differ from standard JavaScript/TypeScript environments. To ensure our code runs correctly in GAS, we've created comprehensive validation tools.

## Tools

### 1. GAS Linter (`scripts/gas-linter.ts`)

A custom linter that validates .gs files for GAS-specific syntax and best practices.

**Features:**
- **Syntax Validation**
  - No ES6 modules (import/export)
  - No async/await
  - No class fields
  - No optional chaining (?.)
  - No nullish coalescing (??)
  - No BigInt

- **Best Practices**
  - Undefined globals checking
  - Function naming conventions
  - Trigger function validation
  - Batch operations detection

- **Security**
  - No eval() usage
  - Proper PropertiesService access

**Usage:**
```bash
# Lint the bundle
npm run validate:gas

# Lint with strict mode
npm run validate:gas:strict

# Lint specific file
tsx scripts/gas-linter.ts path/to/file.gs
```

### 2. GAS Bundle Validator (`scripts/gas-bundle-validator.ts`)

Pre-deployment validation for the final Code.gs bundle.

**Features:**
- Bundle size validation (min 5KB)
- Required functions check
- Syntax validation using Acorn parser
- TypeScript helpers validation
- Dangerous pattern detection
- Source file reference checks

**Usage:**
```bash
# Validate bundle (part of predeploy)
npm run validate:bundle

# Run directly
tsx scripts/gas-bundle-validator.ts
```

## Integration

### Build Pipeline

The validators are integrated into the build pipeline:

```json
{
  "scripts": {
    "predeploy": "npm-run-all validate:all check:strict validate:bundle",
    "validate:all": "npm-run-all validate:namespaces validate:types validate:gas",
    "validate:gas": "tsx scripts/gas-linter.ts",
    "validate:bundle": "npm run build && tsx scripts/gas-bundle-validator.ts"
  }
}
```

### Deployment Script

The deployment script (`scripts/deploy.ts`) runs GAS validation as part of its checks:

```typescript
// GAS-specific validation
try {
  execCommand('npx tsx scripts/gas-linter.ts dist/Code.gs', { silent: !options.verbose });
  log('  ✓ GAS linting passed', 'success');
} catch (error) {
  log('  ✗ GAS compatibility issues detected', 'error');
  throw new Error('Fix GAS issues with: npm run validate:gas');
}
```

## Common Issues and Solutions

### 1. TypeScript Helpers

**Issue:** `__extends is not a function`

**Cause:** TypeScript compiles class inheritance to helper functions that GAS doesn't provide.

**Solution:** Our bundle.ts injects required helpers at the beginning of the bundle.

### 2. ES6 Syntax

**Issue:** Various ES6+ features not supported

**Solutions:**
- Target ES5 in tsconfig.json
- Use ES2022 lib for type definitions
- Avoid unsupported features

### 3. Undefined Globals

**Issue:** Many "undefined" warnings for namespace references

**Solution:** These are expected in bundled code and can be ignored. The linter allows known GAS globals and TypeScript helpers.

## File Deployment

### .claspignore

Ensures only required files are deployed:

```
# Ignore everything except the bundle and manifest
**/**

# Allow only these files
!appsscript.json
!Code.gs
!.clasp.json
```

This results in clean deployments with only 2 files.

## Best Practices

1. **Always run validation before deployment**
   ```bash
   npm run deploy  # Includes all validation
   ```

2. **Fix issues immediately**
   - Don't ignore linting errors
   - Address warnings when possible

3. **Test after changes**
   - Run `npm run validate:all`
   - Check bundle with `npm run validate:bundle`

4. **Keep validators updated**
   - Add new rules as GAS evolves
   - Update for new patterns discovered

## Future Improvements

1. **Auto-fix capability** for common issues
2. **Integration with ESLint** as a plugin
3. **Performance profiling** for GAS-specific bottlenecks
4. **More sophisticated batch operation detection**
5. **Custom rules configuration** file

## References

- [Apps Script Runtime](https://developers.google.com/apps-script/guides/v8-runtime)
- [Apps Script Best Practices](https://developers.google.com/apps-script/guides/best-practices)
- [V8 Runtime Differences](https://developers.google.com/apps-script/guides/v8-runtime/differences)