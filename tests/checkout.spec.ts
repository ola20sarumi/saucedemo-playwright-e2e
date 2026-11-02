import { test, expect } from '../fixtures';
import { customer, missingCustomerFields } from '../test-data/customers';
import { PASSWORD, users } from '../test-data/users';

test.describe('Checkout', () => {
  test.beforeEach(async ({ loginPage, inventoryPage, cartPage }) => {
    await loginPage.goto();
    await loginPage.login(users.standard, PASSWORD);
    await inventoryPage.addToCart('Sauce Labs Backpack');
    await inventoryPage.openCart();
    await cartPage.checkout();
  });

  test(
    'user can complete a purchase end to end',
    { tag: '@smoke' },
    async ({ inventoryPage, checkoutPage }) => {
      await checkoutPage.fillCustomerInfo(customer);
      await checkoutPage.continue();

      await expect(checkoutPage.itemTotal).toHaveText('Item total: $29.99');

      await checkoutPage.finish();

      await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
      await expect(inventoryPage.cartBadge).toBeHidden();
    },
  );

  for (const { field, info, error } of missingCustomerFields) {
    test(`requires a ${field} before continuing`, async ({ checkoutPage }) => {
      await checkoutPage.fillCustomerInfo(info);
      await checkoutPage.continue();

      await expect(checkoutPage.errorMessage).toHaveText(error);
      await expect(checkoutPage.finishButton).toBeHidden();
    });
  }
});
