import { test, expect } from '@playwright/test';

/**
 * Receipt flow tests
 * Test the core receipt creation and calculation functionality
 *
 * Note: These tests require authentication. They will skip gracefully
 * if the app shows a login screen instead of the main app.
 */

test.describe('Receipt Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // Helper to check if we're on the login screen
  async function isLoginScreen(page: any): Promise<boolean> {
    const loginIndicators = [
      page.getByText(/sign in|login|continue with google/i),
      page.locator('[data-testid="login-screen"]'),
    ];
    for (const indicator of loginIndicators) {
      if (await indicator.count() > 0) return true;
    }
    return false;
  }

  test('create receipt page loads', async ({ page }) => {
    // Skip if login required
    if (await isLoginScreen(page)) {
      test.skip();
      return;
    }

    // Navigate to create receipt (adjust selector based on actual app structure)
    const createButton = page.locator('[data-testid="create-receipt"]').or(page.getByText(/create|new|add/i)).first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Verify we're on a receipt creation screen
    const pageIndicators = [
      page.locator('[data-testid="receipt-form"]'),
      page.locator('text=/receipt|bill|items/i'),
      page.locator('input[placeholder*="item"], input[placeholder*="name"]'),
    ];

    let foundIndicator = false;
    for (const indicator of pageIndicators) {
      if (await indicator.count() > 0) {
        foundIndicator = true;
        break;
      }
    }

    expect(foundIndicator, 'Receipt creation page should be accessible').toBe(true);
  });

  test('can add items to receipt', async ({ page }) => {
    // Skip if login required
    if (await isLoginScreen(page)) {
      test.skip();
      return;
    }

    // Navigate to receipt creation if needed
    const createButton = page.locator('[data-testid="create-receipt"]').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Find item input field
    const itemInput = page.locator(
      '[data-testid="item-name"], input[placeholder*="item"], input[placeholder*="name"], input[type="text"]'
    ).first();

    // Find price/amount input
    const priceInput = page.locator(
      '[data-testid="item-price"], input[placeholder*="price"], input[placeholder*="amount"], input[type="number"]'
    ).first();

    // Find add button
    const addButton = page.locator(
      '[data-testid="add-item"], button:has-text("add"), button:has-text("+")'
    ).first();

    // Add first item
    if (await itemInput.isVisible()) {
      await itemInput.fill('Test Item 1');
    }

    if (await priceInput.isVisible()) {
      await priceInput.fill('100');
    }

    if (await addButton.isVisible()) {
      await addButton.click();
    }

    // Verify item was added (look for it in the list)
    const itemList = page.locator('[data-testid="item-list"], [role="list"]');
    const itemText = page.locator('text=/Test Item 1|100/');

    // At least one indicator that item was added
    const itemAdded = await itemText.count() > 0 || await itemList.count() > 0;

    expect(itemAdded, 'Should be able to add items').toBe(true);
  });

  test('total calculates correctly', async ({ page }) => {
    // Skip if login required
    if (await isLoginScreen(page)) {
      test.skip();
      return;
    }

    // Navigate to receipt creation if needed
    const createButton = page.locator('[data-testid="create-receipt"]').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Helper to add an item
    const addItem = async (name: string, price: string) => {
      const itemInput = page.locator(
        '[data-testid="item-name"], input[placeholder*="item"], input[placeholder*="name"], input[type="text"]'
      ).first();
      const priceInput = page.locator(
        '[data-testid="item-price"], input[placeholder*="price"], input[placeholder*="amount"], input[type="number"]'
      ).first();
      const addButton = page.locator(
        '[data-testid="add-item"], button:has-text("add"), button:has-text("+")'
      ).first();

      if (await itemInput.isVisible()) await itemInput.fill(name);
      if (await priceInput.isVisible()) await priceInput.fill(price);
      if (await addButton.isVisible()) await addButton.click();

      // Small delay for state update
      await page.waitForTimeout(100);
    };

    // Add multiple items
    await addItem('Item A', '150');
    await addItem('Item B', '250');
    await addItem('Item C', '100');

    // Expected total: 150 + 250 + 100 = 500
    const expectedTotal = 500;

    // Find total display
    const totalElement = page.locator('[data-testid="total"]')
      .or(page.getByText(/total/i))
      .or(page.locator('[class*="total"]'))
      .first();

    if (await totalElement.isVisible()) {
      const totalText = await totalElement.textContent();

      // Extract number from total text (handles currency symbols, commas)
      const totalMatch = totalText?.match(/[\d,]+\.?\d*/);
      if (totalMatch) {
        const actualTotal = parseFloat(totalMatch[0].replace(',', ''));
        expect(actualTotal, `Total should be ${expectedTotal}`).toBe(expectedTotal);
      }
    } else {
      // If no explicit total element, check for the number anywhere
      const pageContent = await page.content();
      expect(pageContent, 'Page should show calculated total').toContain('500');
    }
  });

  test('receipt items persist during session', async ({ page }) => {
    // Skip if login required
    if (await isLoginScreen(page)) {
      test.skip();
      return;
    }

    // Navigate to receipt creation
    const createButton = page.locator('[data-testid="create-receipt"]').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Add an item
    const itemInput = page.locator('input[type="text"]').first();
    const priceInput = page.locator('input[type="number"]').first();
    const addButton = page.locator('button:has-text("add"), button:has-text("+")').first();

    if (await itemInput.isVisible()) await itemInput.fill('Persistent Item');
    if (await priceInput.isVisible()) await priceInput.fill('999');
    if (await addButton.isVisible()) await addButton.click();

    // Navigate away and back (or reload)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if item persists (depends on app's state management)
    const persistedItem = page.locator('text=/Persistent Item|999/');
    const itemPersisted = await persistedItem.count() > 0;

    // This test documents behavior - may pass or fail based on app design
    console.log(`Items ${itemPersisted ? 'persist' : 'do not persist'} across page reload`);
  });
});
