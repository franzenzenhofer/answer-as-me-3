# Troubleshooting Guide

Common issues and solutions for Answer As Me 3 development.

## Build Errors

### TypeError: __extends is not a function

**Symptom:** Error in Google Apps Script editor after deployment

**Cause:** TypeScript class inheritance generates helper functions that GAS doesn't provide

**Solution:** Already fixed - bundle.ts injects TypeScript helpers at build time

### Cannot find namespace 'Config'

**Symptom:** TypeScript compilation errors

**Cause:** Namespace references before declaration

**Solution:** Run `npm run validate:namespaces:fix`

## Deployment Issues

### Too many files deployed

**Symptom:** clasp push includes source files

**Solution:** .claspignore is configured - ensure it exists with proper content

### Bundle too small error

**Symptom:** Deployment fails with "Bundle too small"

**Cause:** Build failed or bundle is corrupted

**Solution:** 
1. Run `npm run clean`
2. Run `npm run build`
3. Check dist/Code.gs exists and is > 5KB

### GAS compatibility errors

**Symptom:** Code works locally but fails in GAS

**Solution:** Run `npm run validate:gas` to check for issues

## Runtime Errors

### PropertiesService quota exceeded

**Symptom:** Add-on stops working after many uses

**Cause:** Too many property read/writes

**Solution:** Implement caching layer (already done in state.ts)

### Gemini API errors

**Symptom:** Generation fails with API error

**Causes and Solutions:**
1. **Invalid API key** - Check key in settings
2. **Rate limiting** - Circuit breaker will handle retries
3. **Safety blocking** - Adjust prompt content

## Development Issues

### ESLint parsing errors

**Symptom:** ESLint fails on test files

**Solution:** Test files are in .eslintignore

### Jest test failures

**Symptom:** Tests fail with GAS global errors

**Solution:** Mocks are configured in __mocks__/@google-apps-script

### Type checking too strict

**Symptom:** Many type errors with strict mode

**Solution:** Use regular lint for development, strict for pre-deploy

## Quick Fixes

### Reset everything
```bash
npm run clean
rm -rf node_modules
npm install
npm run build
```

### Fix all validation issues
```bash
npm run validate:namespaces:fix
npm run validate:types:fix
npm run setup:gas
```

### Test deployment without pushing
```bash
npm run deploy:dry-run
```

### Check what will be deployed
```bash
clasp status
```

## Debug Mode

To enable verbose logging:

1. **Build verbose:** Add console.log statements (removed by default)
2. **Deploy verbose:** `npm run deploy -- --verbose`
3. **GAS logs:** `clasp logs --watch`

## Common Patterns

### Adding a new module

1. Create `src/modules/mymodule.ts`
2. Add namespace declaration
3. Add to MODULES in bundle.ts
4. Run `npm run build`
5. Run `npm run validate:all`

### Updating contracts

1. Edit contracts in modules
2. Ensure ENABLE_CONTRACTS = false for production
3. Test with contracts enabled locally

### Testing changes

1. Make changes
2. Run `npm run build`
3. Run `npm run validate:all`
4. Run `npm run test:postbundle`
5. Deploy with `npm run deploy`

## Getting Help

1. Check this guide first
2. Run validation tools for specific errors
3. Check git history for working versions
4. Review CLAUDE.md for project standards

## Emergency Rollback

If deployment breaks production:

1. `git log --oneline` - find last working commit
2. `git checkout <commit-hash>`
3. `npm run deploy:force`
4. Fix issues in new branch