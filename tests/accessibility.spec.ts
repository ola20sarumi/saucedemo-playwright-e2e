import type { Page } from '@playwright/test';
import type { Result } from 'axe-core';
import { test, expect, type Pages } from '../fixtures';
import { knownViolations } from '../test-data/a11y-baseline';
import { customer } from '../test-data/customers';
import { PASSWORD, users } from '../test-data/users';

type Journey = Pages & { page: Page };

async function logIn({ loginPage, inventoryPage }: Journey) {
  await loginPage.goto();
  await loginPage.login(users.standard, PASSWORD);
  await expect(inventoryPage.title).toHaveText('Products');
}

async function startCheckout(fixtures: Journey) {
  const { inventoryPage, cartPage, checkoutPage } = fixtures;
  await logIn(fixtures);
  await inventoryPage.addToCart('Sauce Labs Backpack');
  await inventoryPage.openCart();
  await cartPage.checkout();
  await expect(checkoutPage.firstNameInput).toBeVisible();
}

async function reviewOrder(fixtures: Journey) {
  await startCheckout(fixtures);
  await fixtures.checkoutPage.fillCustomerInfo(customer);
  await fixtures.checkoutPage.continue();
  await expect(fixtures.checkoutPage.finishButton).toBeVisible();
}

/** Each row is a screen to scan and the user journey that reaches it. */
const screens: { name: string; open: (fixtures: Journey) => Promise<void> }[] = [
  {
    name: 'login',
    open: async ({ loginPage }) => {
      await loginPage.goto();
      await expect(loginPage.loginButton).toBeVisible();
    },
  },
  { name: 'inventory', open: logIn },
  {
    name: 'product details',
    open: async (fixtures) => {
      await logIn(fixtures);
      await fixtures.inventoryPage.openProduct('Sauce Labs Backpack');
      await expect(fixtures.page.getByTestId('back-to-products')).toBeVisible();
    },
  },
  {
    name: 'cart',
    open: async (fixtures) => {
      await logIn(fixtures);
      await fixtures.inventoryPage.addToCart('Sauce Labs Backpack');
      await fixtures.inventoryPage.openCart();
      await expect(fixtures.cartPage.title).toHaveText('Your Cart');
    },
  },
  { name: 'checkout information', open: startCheckout },
  { name: 'checkout overview', open: reviewOrder },
  {
    name: 'checkout complete',
    open: async (fixtures) => {
      await reviewOrder(fixtures);
      await fixtures.checkoutPage.finish();
      await expect(fixtures.checkoutPage.completeHeader).toBeVisible();
    },
  },
];

/** One readable line per violation, so a failure says what broke and where. */
function summarise(violation: Result) {
  const where = violation.nodes.map((node) => node.target.join(' ')).join(', ');
  return `${violation.id} (${violation.impact}): ${violation.help} -> ${where}`;
}

test.describe('Accessibility', () => {
  for (const { name, open } of screens) {
    test(`${name} page has no new accessibility violations`, async ({
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutPage,
      makeAxeBuilder,
    }, testInfo) => {
      await open({ page, loginPage, inventoryPage, cartPage, checkoutPage });

      const results = await makeAxeBuilder().analyze();
      await testInfo.attach('axe-violations', {
        body: JSON.stringify(results.violations, null, 2),
        contentType: 'application/json',
      });

      const baseline = new Set((knownViolations[name] ?? []).map(({ rule }) => rule));
      const found = new Set(results.violations.map(({ id }) => id));

      // Flag baseline entries the site has since fixed, so the baseline doesn't quietly go stale.
      for (const rule of [...baseline].filter((rule) => !found.has(rule))) {
        testInfo.annotations.push({
          type: 'stale baseline',
          description: `"${rule}" no longer occurs on the ${name} page; remove it from test-data/a11y-baseline.ts.`,
        });
      }

      const newViolations = results.violations.filter(({ id }) => !baseline.has(id));
      expect(newViolations.map(summarise)).toEqual([]);
    });
  }
});
