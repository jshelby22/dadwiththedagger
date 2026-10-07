import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  use: { baseURL: process.env.SITE_URL || 'http://127.0.0.1:4178', browserName: 'chromium', viewport: { width: 1440, height: 1000 } },
  webServer: process.env.SITE_URL ? undefined : { command: 'npm run serve', url: 'http://127.0.0.1:4178', reuseExistingServer: !process.env.CI },
  reporter: 'list'
});
