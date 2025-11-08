import { describe, expect, it } from 'vitest';

import { GET } from './+server';

function createDb(tables: Record<string, any[]>) {
	return {
		prepare: (query: string) => {
			const table = Object.keys(tables).find((name) => query.includes(name));
			return {
				bind: () => ({
					all: async () => ({ results: tables[table || ''] || [] })
				})
			};
		}
	};
}

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
		const tables = {
			personal_info: [{ legal_name: 'Casey Planner' }],
			credentials: [],
			pets: [],
			key_contacts: [],
			medical_info: [],
			physicians: [],
			employment: [],
			primary_residence: [],
			vehicles: [],
			insurance: [],
			bank_accounts: [],
			legal_documents: [],
			final_days: [],
			obituary: [],
			after_death: [],
			funeral: []
		};

		const response = await GET({
			platform: { env: { DB: createDb(tables) } },
			locals: { user: { id: 1, username: 'casey', email: 'casey@example.com' } }
		} as any);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.user.username).toBe('casey');
		expect(body.data.personalInfo).toEqual([{ legal_name: 'Casey Planner' }]);
		expect(body.exportedAt).toBeTruthy();
	});
});
