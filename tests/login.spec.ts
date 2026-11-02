import { test, expect } from '../fixtures';
import { PASSWORD, invalidLogins, users } from '../test-data/users';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test(
    'standard user can log in and sees the product list',
    { tag: '@smoke' },
    async ({ page, loginPage, inventoryPage }) => {
      await loginPage.login(users.standard, PASSWORD);

      await expect(page).toHaveURL(/\/inventory\.html$/);
      await expect(inventoryPage.title).toHaveText('Products');
      await expect(inventoryPage.items).toHaveCount(6);
    },
  );

  for (const { scenario, username, password, error } of invalidLogins) {
    test(`shows an error for ${scenario}`, async ({ page, loginPage }) => {
      await loginPage.login(username, password);

      await expect(loginPage.errorMessage).toHaveText(error);
      await expect(page).not.toHaveURL(/inventory/);
    });
  }
});

test.describe('Session', () => {
  test(
    'user can log out and return to the login page',
    { tag: '@smoke' },
    async ({ loginPage, inventoryPage }) => {
      await loginPage.goto();
      await loginPage.login(users.standard, PASSWORD);
      await expect(inventoryPage.title).toHaveText('Products');

      await inventoryPage.logout();

      await expect(loginPage.loginButton).toBeVisible();
    },
  );

  test('inventory page cannot be opened without logging in', async ({ loginPage, inventoryPage }) => {
    await inventoryPage.goto();

    await expect(loginPage.errorMessage).toHaveText(
      "Epic sadface: You can only access '/inventory.html' when you are logged in.",
    );
  });
});
