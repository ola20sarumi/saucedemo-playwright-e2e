import { test, expect } from '../fixtures';
import type { SortOption } from '../pages/InventoryPage';
import { PASSWORD, users } from '../test-data/users';

const parsePrice = (price: string) => Number(price.replace('$', ''));
const byName = (a: string, b: string) => a.localeCompare(b);
const byPrice = (a: string, b: string) => parsePrice(a) - parsePrice(b);

const sortCases: {
  option: SortOption;
  label: string;
  column: 'itemNames' | 'itemPrices';
  compare: (a: string, b: string) => number;
}[] = [
  { option: 'az', label: 'name (A to Z)', column: 'itemNames', compare: byName },
  { option: 'za', label: 'name (Z to A)', column: 'itemNames', compare: (a, b) => byName(b, a) },
  { option: 'lohi', label: 'price (low to high)', column: 'itemPrices', compare: byPrice },
  { option: 'hilo', label: 'price (high to low)', column: 'itemPrices', compare: (a, b) => byPrice(b, a) },
];

test.beforeEach(async ({ loginPage, inventoryPage }) => {
  await loginPage.goto();
  await loginPage.login(users.standard, PASSWORD);
  await expect(inventoryPage.title).toHaveText('Products');
});

test.describe('Product sorting', () => {
  for (const { option, label, column, compare } of sortCases) {
    test(`sorts products by ${label}`, async ({ inventoryPage }) => {
      const values = inventoryPage[column];
      const expected = (await values.allTextContents()).sort(compare);

      await inventoryPage.sortBy(option);

      await expect(values).toHaveText(expected);
    });
  }
});

test.describe('Cart', () => {
  test('cart badge tracks items as they are added and removed', async ({ inventoryPage }) => {
    await expect(inventoryPage.cartBadge).toBeHidden();

    await inventoryPage.addToCart('Sauce Labs Backpack');
    await inventoryPage.addToCart('Sauce Labs Bike Light');
    await expect(inventoryPage.cartBadge).toHaveText('2');

    await inventoryPage.removeFromCart('Sauce Labs Backpack');
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  test('added products appear in the cart', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addToCart('Sauce Labs Backpack');
    await inventoryPage.addToCart('Sauce Labs Bike Light');

    await inventoryPage.openCart();

    await expect(cartPage.title).toHaveText('Your Cart');
    await expect(cartPage.itemNames).toHaveText(['Sauce Labs Backpack', 'Sauce Labs Bike Light']);
  });
});
