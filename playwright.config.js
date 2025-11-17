import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 8788,
		reuseExistingServer: !process.env.CI
	},
	testDir: 'e2e'
});
