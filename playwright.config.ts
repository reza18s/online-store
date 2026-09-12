import { defineConfig, devices } from '@playwright/test';

import { parseE2eEndpoint } from './test/e2e/run';

const webEndpoint = parseE2eEndpoint(
  'NOVA_E2E_WEB_URL',
  process.env.NOVA_E2E_WEB_URL,
  'http://127.0.0.1:5173',
);
const browserExecutablePath = process.env.NOVA_E2E_BROWSER_PATH;
const browserChannel = process.env.NOVA_E2E_BROWSER_CHANNEL;

if (browserExecutablePath && browserChannel) {
  throw new Error('Set only one of NOVA_E2E_BROWSER_PATH or NOVA_E2E_BROWSER_CHANNEL.');
}

if (browserChannel && browserChannel !== 'chrome') {
  throw new Error('Invalid NOVA_E2E_BROWSER_CHANNEL: only "chrome" is supported.');
}

export default defineConfig({
  testDir: './test/e2e/browser',
  testMatch: '**/*.pw.ts',
  outputDir: 'test-results/playwright',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: webEndpoint.safeOrigin,
    launchOptions: browserExecutablePath
      ? { executablePath: browserExecutablePath }
      : browserChannel
        ? { channel: browserChannel }
        : undefined,
    trace: process.env.CI ? 'retain-on-failure' : 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
