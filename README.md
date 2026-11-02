# Sauce Demo E2E Test Suite

[![Playwright Tests](https://github.com/ola20sarumi/simple-login-automation/actions/workflows/playwright.yml/badge.svg)](https://github.com/ola20sarumi/simple-login-automation/actions/workflows/playwright.yml)
[![Latest test report](https://img.shields.io/badge/report-latest-45ba4b?logo=playwright)](https://ola20sarumi.github.io/simple-login-automation/)

End-to-end UI tests for [Sauce Demo](https://www.saucedemo.com), a demo e-commerce store, written in **Playwright** and **TypeScript** using the **Page Object Model**. The suite covers the core user journeys (login, browsing, cart and checkout) across **Chromium, Firefox and WebKit**, and runs in GitHub Actions on every push, every pull request and nightly.

**[View the latest test report →](https://ola20sarumi.github.io/simple-login-automation/)**

![HTML report showing 54 passing tests across Chromium, Firefox and WebKit](docs/report-screenshot.png)

## What's covered

18 test cases, each run in 3 browsers (54 runs in total).

| Area         | Scenarios                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| **Login**    | Successful login · wrong password · unknown user · locked-out user · empty username · empty password |
| **Session**  | Logout · protected page blocks users who are not logged in                                           |
| **Sorting**  | Name A→Z · name Z→A · price low→high · price high→low                                                |
| **Cart**     | Badge count updates on add/remove · added items appear in the cart                                   |
| **Checkout** | Full purchase with order total check · first name, last name and postal code each required           |

The 3 critical-path tests (login, logout, full purchase) are tagged `@smoke` so they can run on their own as a fast check.

## Tech stack

- [Playwright Test](https://playwright.dev) 1.64 with TypeScript 6 (strict mode)
- ESLint 10 (`typescript-eslint`, `eslint-plugin-playwright`) and Prettier
- GitHub Actions on Ubuntu 24.04 / Node 22, with the HTML report published to GitHub Pages

## Project structure

```
├── pages/          Page objects: one class per screen, holding its locators and actions
├── fixtures/       Extends Playwright's `test` to pass page objects into each test
├── test-data/      Users, invalid-login cases and checkout data, kept apart from test logic
├── tests/          Specs: login, inventory (sorting and cart), checkout
├── .github/        CI workflow
└── playwright.config.ts
```

## Getting started

Requires Node.js 20.19+ or 22.13+.

```bash
npm install
npx playwright install
npm test
```

No configuration is needed: the suite defaults to Sauce Demo's public demo accounts. To point it at another environment or other credentials, copy `.env.example` to `.env` and edit the values.

### Scripts

| Command                               | What it does                                              |
| ------------------------------------- | --------------------------------------------------------- |
| `npm test`                            | Run the full suite in all three browsers                  |
| `npm run test:smoke`                  | Run only the `@smoke` critical-path tests                 |
| `npm run test:chromium`               | Run in Chromium only (fastest local feedback)             |
| `npm run test:headed`                 | Run with visible browser windows                          |
| `npm run test:ui`                     | Open Playwright UI mode to run and step through tests     |
| `npm run report`                      | Open the last HTML report                                 |
| `npm run check`                       | Type-check, lint and format-check (the same gate CI runs) |
| `npm run lint:fix` / `npm run format` | Auto-fix lint and formatting issues                       |

## CI pipeline

[`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) runs on every push and pull request to `main`, nightly at 06:00 UTC, and on demand:

1. **Quality gate:** type-check, lint and format-check. If this fails, no tests run.
2. **Tests:** one parallel job per browser. Each job installs only its own browser, and one browser failing doesn't cancel the others.
3. **Report:** each job's results are merged into a single HTML report, which is attached to the run.
4. **Publish:** on `main`, the merged report is deployed to GitHub Pages.

Failing tests also appear as inline annotations on the pull request. Traces are recorded on retry and screenshots are captured on failure, so CI failures can be debugged without rerunning locally.

The nightly run matters because the site under test can change even when this repository doesn't.

## Design decisions

- **Page Object Model.** Locators and page actions live in `pages/`, so specs read as user behaviour (`inventoryPage.addToCart('Sauce Labs Backpack')`) and a UI change is fixed in one place, not in every test.
- **Page objects as fixtures.** Tests receive page objects through `test.extend` (`async ({ loginPage, cartPage }) => …`) instead of constructing them by hand. Each test declares exactly what it depends on, and adding a page object means one new fixture, not edits to every spec. `beforeEach` is kept only for the user journey that sets up a test (such as logging in), so the setup steps stay visible in the spec.
- **Locator strategy.** Elements are found by role (`getByRole`) or by the app's own `data-test` attributes (`getByTestId`), never by CSS classes or DOM structure. These are the locators least likely to break when the UI is restyled.
- **Data-driven tests.** Invalid-login cases, sort orders and required checkout fields are tables in `test-data/` or at the top of the spec. Adding a case means adding a row, not copying a test.
- **Exact assertions.** Error tests check the full message text, so a test fails if the wrong error appears, not just when no error appears. Sorting tests derive the expected order from what the page actually shows instead of a hard-coded list.
- **Web-first assertions only.** Every check uses Playwright's auto-retrying `expect(locator)`, so there are no fixed waits. ESLint enforces this and also catches any missing `await`, the most common cause of flaky tests.
- **Configuration from the environment.** The base URL and credentials come from environment variables with safe defaults, so the same suite could run against staging with secrets injected by CI.
- **A pinned CI environment.** CI originally ran on `ubuntu-latest`. When GitHub moved that label to Ubuntu 26.04, every browser job failed before a single test ran, because the Playwright version in use couldn't install browsers there. The runner image and Node version are now pinned, so the build only changes when this repo changes, and environment upgrades become deliberate, reviewable pull requests.

## Trade-offs and next steps

- **Logging in through the UI in every test.** This is simple and keeps each test independent, at the cost of a few seconds per test. At larger scale, I'd log in once in a setup project and reuse the session through `storageState`.
- **Testing a public site I don't control.** The site could change or go down without warning. The nightly run makes that visible quickly. Against a real product, I'd run the suite against a dedicated test environment instead.
- **UI tests only.** A natural next layer would be API tests (Playwright's `request` fixture) for faster checks of business rules, plus accessibility checks with `@axe-core/playwright` and visual regression with `toHaveScreenshot()`.

## How this was built

Built with AI assistance (Claude Code). I directed the architecture and reviewed every change; the design decisions above are mine and I'm happy to walk through any of them.
