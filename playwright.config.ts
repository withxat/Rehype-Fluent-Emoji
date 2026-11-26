import process from 'node:process'

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	forbidOnly: !!process.env.CI,
	fullyParallel: false,
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				permissions: ['clipboard-read', 'clipboard-write'],
			},
		},
	],
	reporter: 'line',
	retries: 0,
	testDir: 'test',
	testMatch: '**/*.browser.ts',
	timeout: 60_000,
	workers: 1,
})
