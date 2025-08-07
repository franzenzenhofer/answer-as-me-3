#!/usr/bin/env tsx

/**
 * SUPER FAST Pre-deployment Script
 * Runs all validations in parallel for maximum speed
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

async function runFastPredeploy(): Promise<void> {
  const startTime = Date.now();
  console.log(chalk.blue('⚡ SUPER FAST Pre-deployment Validation...\n'));

  // Run ALL validations in parallel
  const validations = [
    { name: 'Namespace validation', cmd: 'npx tsx scripts/namespace-validator.ts' },
    { name: 'Type validation', cmd: 'npx tsx scripts/gas-type-checker.ts' },
    { name: 'GAS linting', cmd: 'npx tsx scripts/gas-linter.ts' },
    { name: 'TypeScript check', cmd: 'tsc --noEmit' },
    { name: 'ESLint', cmd: 'eslint src/**/*.ts --max-warnings 100' } // Allow some warnings for speed
  ];

  const results = await Promise.allSettled(
    validations.map(async ({ name, cmd }) => {
      const start = Date.now();
      try {
        await execAsync(cmd);
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        return { name, status: 'success', time: elapsed };
      } catch (error) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        return { name, status: 'failed', time: elapsed, error };
      }
    })
  );

  // Report results
  let hasErrors = false;
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      const { name, status, time } = result.value;
      if (status === 'success') {
        console.log(chalk.green(`✅ ${name} - ${time}s`));
      } else {
        console.log(chalk.red(`❌ ${name} - ${time}s`));
        hasErrors = true;
      }
    }
  });

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(chalk.blue(`\n⚡ Total validation time: ${totalTime}s`));

  if (hasErrors) {
    console.log(chalk.red('\n❌ Pre-deployment validation failed!'));
    process.exit(1);
  } else {
    console.log(chalk.green('\n✅ All validations passed!'));
  }
}

runFastPredeploy().catch(error => {
  console.error(chalk.red('❌ Pre-deployment failed:'), error);
  process.exit(1);
});