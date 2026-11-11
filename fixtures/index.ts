import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { axeTags } from '../test-data/a11y-baseline';

export type Pages = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

type Fixtures = Pages & {
  /** Returns an axe scanner for the current page, preconfigured with the rule tags the suite checks. */
  makeAxeBuilder: () => AxeBuilder;
};

/**
 * Extends Playwright's `test` so specs receive ready-made page objects as fixtures,
 * e.g. `test('...', async ({ loginPage }) => { ... })`, instead of constructing them by hand.
 */
export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  makeAxeBuilder: async ({ page }, use) => {
    await use(() => new AxeBuilder({ page }).withTags(axeTags));
  },
});

export { expect };
