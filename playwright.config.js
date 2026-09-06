const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './browser-test',
  use: { browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true },
});
