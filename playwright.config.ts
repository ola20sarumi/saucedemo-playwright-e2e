import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

/* Load overrides from a local `.env` file if one exists. See `.env.example`. */
dotenv.config({ quiet: true });

const isCI = !!process.env.CI;

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  /* Fail the build on CI if test.only is left in the source. */
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  /*
   * Locally: readable terminal output plus the HTML report.
   * CI: a blob report per browser job (merged into one HTML report later), and
   * GitHub annotations that mark failures inline on the pull request.
   */
  reporter: isCI ? [['blob'], ['github']] : [['list'], ['html']],

  use: {
    baseURL: process.env.BASE_URL ?? 'https://www.saucedemo.com',
    /* Sauce Demo exposes stable `data-test` attributes, so getByTestId() targets those. */
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
