import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/genericSectionData', () => ({
	getSectionDataBySlugs: vi.fn()
}));

vi.mock('$lib/server/legacySectionLoaders', () => ({
	loadLegacySectionData: vi.fn()
}));

import { GET } from './+server';
import { getSectionDataBySlugs } from '$lib/server/genericSectionData';
import { loadLegacySectionData } from '$lib/server/legacySectionLoaders';

const mockedGetSectionDataBySlugs = vi.mocked(getSectionDataBySlugs);
const mockedLoadLegacySectionData = vi.mocked(loadLegacySectionData);

beforeEach(() => {
	mockedGetSectionDataBySlugs.mockReset();
	mockedLoadLegacySectionData.mockReset();
});

describe('GET /api/export-data', () => {
	it('requires authentication', async () => {
		const response = await GET({
			platform: { env: { DB: {} } },
			locals: { user: null }
		} as any);

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: 'Unauthorized' });
	});

	it('fails when the database binding is missing', async () => {
		const response = await GET({
			platform: { env: {} },
			locals: { user: { id: 1, username: 'casey', email: 'casey@example.com' } }
		} as any);

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ error: 'Database not available' });
	});

	it('aggregates user data from all tables', async () => {
		const tables: Record<string, any> = {
			personal: { legal_name: 'Casey Planner' },
			credentials: [],
			pets: [],
			contacts: [],
			medical: [],
			physicians: [],
			employment: [],
			residence: [],
			vehicles: [],
			insurance: [],
			financial: [],
			legal: [],
			'final-days': [],
			obituary: [],
			'after-death': [],
			funeral: []
		};

		mockedGetSectionDataBySlugs.mockResolvedValue({
			personal: { data: tables.personal }
		} as any);
		mockedLoadLegacySectionData.mockImplementation(async (_, __, slug: any) => tables[slug] ?? []);

		const response = await GET({
			platform: { env: { DB: {} } },
			locals: { user: { id: 1, username: 'casey', email: 'casey@example.com' } }
		} as any);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.user.username).toBe('casey');
		expect(body.data.personalInfo).toEqual([{ legal_name: 'Casey Planner' }]);
		expect(body.exportedAt).toBeTruthy();
	});
});
