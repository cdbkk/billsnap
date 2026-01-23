import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for React Native Expo web testing
 * Mobile-first approach: Mobile viewport is primary, desktop secondary
 */

const AUTH_FILE = 'tests/.auth/user.json';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Setup project - runs first to authenticate (headed so you can see it)
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: {
        headless: false, // Show browser for interactive OTP entry
      },
    },

    // Primary: Mobile viewport (iPhone 14 Pro dimensions)
    {
      name: 'mobile',
      use: {
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 3,
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
    },

    // Secondary: Desktop viewport
    {
      name: 'desktop',
      use: {
        viewport: { width: 1280, height: 720 },
        hasTouch: false,
        isMobile: false,
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
    },
  ],

  // Web server configuration for Expo
  webServer: {
    command: 'npx expo start --web',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // Expo can take a while to start
  },
});
