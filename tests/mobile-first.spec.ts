import { test, expect } from '@playwright/test';

/**
 * Mobile-first tests
 * Verify the app meets mobile usability standards
 */

test.describe('Mobile-First Requirements', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for Expo web app to hydrate
    await page.waitForLoadState('networkidle');
  });

  test('touch targets are at least 48px', async ({ page }) => {
    // Get all interactive elements (buttons, links, inputs)
    const interactiveElements = page.locator('button, a, input, [role="button"], [data-testid]');
    const count = await interactiveElements.count();

    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i);
      const isVisible = await element.isVisible();

      if (isVisible) {
        const box = await element.boundingBox();
        if (box) {
          const minDimension = Math.min(box.width, box.height);
          if (minDimension < 48) {
            const text = await element.textContent() || 'unknown';
            violations.push(`Element "${text.trim().slice(0, 20)}" is ${Math.round(minDimension)}px (min 48px required)`);
          }
        }
      }
    }

    expect(violations, `Touch target violations:\n${violations.join('\n')}`).toHaveLength(0);
  });

  test('no horizontal scroll on mobile', async ({ page }) => {
    // Check that page doesn't have horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll, 'Page should not have horizontal scroll on mobile').toBe(false);
  });

  test('bottom navigation is visible and accessible', async ({ page }) => {
    // Look for common bottom nav patterns
    const bottomNav = page.locator('[data-testid="bottom-nav"], nav, [role="navigation"]').last();

    // Check if navigation exists
    const navExists = await bottomNav.count() > 0;

    if (navExists) {
      const isVisible = await bottomNav.isVisible();
      expect(isVisible, 'Bottom navigation should be visible').toBe(true);

      // Check it's positioned near bottom of viewport
      const box = await bottomNav.boundingBox();
      if (box) {
        const viewportHeight = 844; // Mobile viewport height
        const navBottom = box.y + box.height;
        expect(navBottom, 'Navigation should be near bottom of screen').toBeGreaterThan(viewportHeight - 100);
      }
    } else {
      // If no nav found, test passes but logs info
      console.log('No bottom navigation found - skipping position check');
    }
  });

  test('viewport meta tag is configured correctly', async ({ page }) => {
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');

    expect(viewportMeta).toBeTruthy();
    expect(viewportMeta).toContain('width=device-width');
    expect(viewportMeta).toContain('initial-scale=1');
  });

  test('text is readable without zooming', async ({ page }) => {
    // Check that body text is at least 16px (prevents iOS zoom on input focus)
    const bodyFontSize = await page.evaluate(() => {
      const body = document.body;
      const style = window.getComputedStyle(body);
      return parseFloat(style.fontSize);
    });

    expect(bodyFontSize, 'Base font size should be at least 16px').toBeGreaterThanOrEqual(16);
  });
});
