import { test as setup } from '@playwright/test';

const AUTH_FILE = 'tests/.auth/user.json';

/**
 * Manual OTP Authentication setup
 *
 * Opens browser, you log in manually, it saves the session.
 *
 * Usage:
 *   npx playwright test --project=setup
 */

setup('authenticate', async ({ page }) => {
  // 10 minute timeout for manual login
  setup.setTimeout(600000);

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Check if already logged in
  const signInButton = page.getByText(/sign in with email/i);
  if (!(await signInButton.isVisible())) {
    console.log('✅ Already authenticated!');
    await page.context().storageState({ path: AUTH_FILE });
    return;
  }

  console.log('\n🔐 Browser opened - LOG IN MANUALLY\n');
  console.log('1. Click "Sign in with Email"');
  console.log('2. Enter your email');
  console.log('3. Check email for OTP code');
  console.log('4. Enter the code and verify\n');
  console.log('⏳ Waiting for you to log in (will detect Supabase auth)...\n');

  // Wait for Supabase auth token in localStorage
  // Supabase uses format: sb-<project-ref>-auth-token
  await page.waitForFunction(() => {
    const keys = Object.keys(localStorage);
    return keys.some(key => key.startsWith('sb-') && key.includes('auth'));
  }, { timeout: 600000 });

  console.log('✅ Logged in!');

  // Skip onboarding for testing (this is a mobile app, web is just for Playwright)
  await page.evaluate(() => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    localStorage.setItem('onboardingData', JSON.stringify({
      storeType: 'general',
      shopMode: 'quick',
      shopName: 'Test Shop',
      promptPayId: ''
    }));
  });
  console.log('⏭️  Skipped onboarding (injected test data)');

  // Reload so app picks up the new localStorage values
  await page.reload();
  await page.waitForLoadState('networkidle');
  console.log('🔄 Reloaded page');

  // Wait for app to navigate to main tabs
  await page.waitForURL('**/tabs**', { timeout: 10000 }).catch(() => {
    console.log('⚠️  Did not navigate to tabs, but continuing anyway');
  });

  await page.context().storageState({ path: AUTH_FILE });
  console.log(`💾 Session saved to ${AUTH_FILE}\n`);
});
