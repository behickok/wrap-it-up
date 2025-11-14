import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';

import { SECTIONS } from '$lib/types';
import Page from './+page.svelte';

function createPageData() {
	const sectionData = {
		personal: {},
		credentials: [],
		contacts: [],
		legal: [],
		documents: [],
		'final-days': {},
		'after-death': {},
		funeral: {},
		obituary: {},
		conclusion: {},
		financial: [],
		insurance: [],
		employment: [],
		residence: {},
		property: [],
		family: { members: [], history: {} },
		medical: { physicians: [] },
		pets: []
	};

	/** @type {Record<string, number>} */
	const sectionScores = {};
	SECTIONS.forEach((section, index) => {
		sectionScores[section.id] = index === 0 ? 80 : 40;
	});

	const readinessScore = {
		total_score: 72,
		sections: sectionScores
	};

	return {
		readinessScore,
		sectionData,
		userId: 1,
		userJourneys: [],
		isMentor: false,
		user: {
			id: 1,
			email: 'test@example.com',
			username: 'tester',
			is_active: true,
			last_login: null,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		featuredJourneys: [],
		enrolledJourneys: [],
		availableJourneys: []
	};
}

describe('/+page.svelte', () => {
	it('renders the export call-to-action with a working button', async () => {
		render(Page, { target: document.body, props: { data: createPageData() } });

		const heading = page.getByRole('heading', {
			level: 2,
			name: 'Your End-of-Life Planning Document'
		});
		await expect.element(heading).toBeVisible();

		const exportButton = page.getByRole('button', { name: 'Export to PDF' });
		await expect.element(exportButton).toBeEnabled();
	});

	it('shows journey tabs for each planning category', async () => {
		render(Page, { target: document.body, props: { data: createPageData() } });

		const planTab = page.getByRole('tab', { name: /Plan Legal & Financial Foundation/ });
		await expect.element(planTab).toBeInTheDocument();

		const legacyTab = page.getByRole('tab', { name: /Legacy End-of-Life Planning/ });
		await expect.element(legacyTab).toBeInTheDocument();
	});

	it('lists the sections for the active category in the sidebar', async () => {
		render(Page, { target: document.body, props: { data: createPageData() } });

		const legalButton = page.getByRole('button', { name: /Legal Documents/ });
		await expect.element(legalButton).toBeInTheDocument();

		const financialButton = page.getByRole('button', { name: /Financial Accounts/ });
		await expect.element(financialButton).toBeInTheDocument();
	});
});
