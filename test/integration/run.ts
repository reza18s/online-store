import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  commerceIntegrationSuites,
  unavailableRuntimeCoverage,
  type CommerceIntegrationSuite,
} from './suites';

const integrationDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(integrationDirectory, '..', '..');
function selectedSuites(): readonly CommerceIntegrationSuite[] {
  const requested = process.env.NOVA_INTEGRATION_SUITE?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!requested?.length) return commerceIntegrationSuites;

  const selected = commerceIntegrationSuites.filter((suite) => requested.includes(suite.id));
  const unknown = requested.filter(
    (id) => !commerceIntegrationSuites.some((suite) => suite.id === id),
  );
  if (unknown.length) {
    throw new Error(
      `Unknown NOVA_INTEGRATION_SUITE value(s): ${unknown.join(', ')}. ` +
        `Available suites: ${commerceIntegrationSuites.map((suite) => suite.id).join(', ')}.`,
    );
  }
  return selected;
}

function printOutput(output: string | null | undefined, stream: 'stdout' | 'stderr'): void {
  const text = output?.trimEnd() ?? '';
  if (!text) return;
  const target = stream === 'stderr' ? console.error : console.log;
  target(text);
}

function runSuite(suite: CommerceIntegrationSuite): boolean {
  const missing = suite.files.filter((file) => !existsSync(resolve(repositoryRoot, file)));
  if (missing.length) {
    console.error(`[FAIL] ${suite.id}: manifest file(s) missing: ${missing.join(', ')}`);
    return false;
  }

  console.log(`\n[integration] ${suite.id}: ${suite.label}`);
  console.log(`[integration] capabilities: ${suite.capabilities.join('; ')}`);

  const result = spawnSync(process.execPath, ['test', ...suite.files], {
    cwd: repositoryRoot,
    stdio: 'pipe',
    encoding: 'utf8',
  });
  printOutput(result.stdout, 'stdout');
  printOutput(result.stderr, 'stderr');

  if (result.error) {
    console.error(`[FAIL] ${suite.id}: could not start Bun test: ${result.error.message}.`);
    return false;
  }
  if (result.status !== 0) {
    console.error(`[FAIL] ${suite.id}: Bun test exited with ${result.status ?? 'unknown'}.`);
    return false;
  }

  console.log(`[PASS] ${suite.id}`);
  return true;
}

function main(): void {
  const suites = selectedSuites();
  console.log('TEST-001 deterministic commerce integration harness');
  console.log(`repository: ${repositoryRoot}`);
  console.log(`suites: ${suites.map((suite) => suite.id).join(', ')}`);
  console.log('providers: repository-owned deterministic fakes only');
  console.log(`unavailable by design: ${unavailableRuntimeCoverage.join(' | ')}`);

  const failures = suites.filter((suite) => !runSuite(suite));
  if (failures.length) {
    console.error(`\nIntegration harness failed: ${failures.map((suite) => suite.id).join(', ')}`);
    process.exitCode = 1;
    return;
  }

  console.log(`\nIntegration harness passed: ${suites.length} suite(s).`);
  console.log('This command does not claim live database, provider, or browser coverage.');
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
