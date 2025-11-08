import { describe, expect, it, vi } from 'vitest';

import { actions, load } from './+page.server';

function createEventOverrides(overrides: Partial<Parameters<typeof load>[0]> = {}) {
	return {
		locals: { user: { id: 1 }, ...overrides.locals },
		platform: { env: { DB: overrides.platform?.env?.DB ?? createStubDb() } },
		...overrides
	} as Parameters<typeof load>[0];
}

function createStubDb(responses: Partial<Record<string, any>> = {}) {
	return {
		prepare: vi.fn((query: string) => {
			const key = Object.keys(responses).find((match) => query.includes(match));
			const value = key ? responses[key] : undefined;

			return {
				bind: vi.fn(() => ({
					first: vi.fn(async () => value?.first ?? null),
					all: vi.fn(async () => ({ results: value?.all ?? [] })),
					run: vi.fn(async () => value?.run)
				}))
			};
		})
	};
}

describe('load', () => {
	it('redirects anonymous visitors to /login', async () => {
		await expect(
			load(
				createEventOverrides({
					locals: { user: null }
				})
			)
		).rejects.toMatchObject({ status: 302, location: '/login' });
	});

	it('returns empty section data when the database binding is missing', async () => {
		const result = await load(
			createEventOverrides({
				platform: { env: {} }
			})
		);

		expect(result).toEqual({ sectionData: {}, userId: 1 });
	});

	it('assembles dashboard data from Cloudflare D1 queries', async () => {
		const db = createStubDb({
			personal_info: { first: { legal_name: 'Casey Planner' } },
			credentials: {
				all: [
					{
						user_id: 1,
						site_name: 'Mail',
						web_address: 'https://mail.example.com',
						username: 'casey',
						password: 'secret',
						category: 'email',
						other_info: ''
					}
				]
			},
			key_contacts: {
				all: [{ user_id: 1, relationship: 'Emergency contact', name: 'Jordan', phone: '555-1111' }]
			},
			final_days: { first: { who_around: 'Family' } },
			after_death: { first: { contact_name: 'Alex' } },
			conclusion: { first: { final_thoughts: 'Stay curious.' } },
			employment: {
				all: [
					{
						user_id: 1,
						employer_name: 'Wrap It Up',
						position: 'Planner',
						hire_date: '2020-01-01',
						supervisor: 'Jordan',
						supervisor_contact: '555-2222',
						is_current: 1
					}
				]
			}
		});

		const result = await load(
			createEventOverrides({
				platform: { env: { DB: db } }
			})
		);

		expect(result.sectionData.personal).toEqual({ legal_name: 'Casey Planner' });
		expect(result.sectionData.credentials).toHaveLength(1);
		expect(result.sectionData.contacts[0].relationship).toBe('Emergency contact');
		expect(result.sectionData['final-days'].who_around).toBe('Family');
		expect(result.sectionData['after-death'].contact_name).toBe('Alex');
		expect(result.sectionData.employment[0].employer_name).toBe('Wrap It Up');
	});
});

describe('actions.addCredential', () => {
	it('inserts the credential and recalculates the readiness score', async () => {
		const inserted: Record<string, unknown>[][] = [];
		const sectionCompletionBinds: any[] = [];

		const credentialsRows = [
			{
				user_id: 1,
				site_name: 'Mail',
				web_address: 'https://mail.example.com',
				username: 'casey',
				password: 'secret',
				category: 'email',
				other_info: ''
			}
		];

		const db = {
			prepare: vi.fn((query: string) => {
				if (query.includes('INSERT INTO credentials')) {
					return {
						bind: vi.fn((...args: any[]) => ({
							run: vi.fn(async () => {
								inserted.push(args);
							})
						}))
					};
				}

				if (query.includes('SELECT * FROM credentials')) {
					return {
						bind: vi.fn(() => ({
							all: vi.fn(async () => ({ results: credentialsRows }))
						}))
					};
				}

				if (query.includes('INSERT INTO section_completion')) {
					return {
						bind: vi.fn((...args: any[]) => ({
							run: vi.fn(async () => {
								sectionCompletionBinds.push(args);
							})
						}))
					};
				}

				return {
					bind: vi.fn(() => ({
						run: vi.fn(async () => undefined),
						all: vi.fn(async () => ({ results: [] })),
						first: vi.fn(async () => null)
					}))
				};
			})
		};

		const formData = new FormData();
		formData.set('site_name', 'Mail');
		formData.set('web_address', 'https://mail.example.com');
		formData.set('username', 'casey');
		formData.set('password', 'secret');
		formData.set('category', 'email');
		formData.set('other_info', 'notes');

		const response = await actions.addCredential({
			request: { formData: async () => formData } as Request,
			locals: { user: { id: 1 } },
			platform: { env: { DB: db } }
		});

		expect(response).toEqual({ success: true });
		expect(inserted).toHaveLength(1);
		expect(sectionCompletionBinds).toHaveLength(1);
		expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO credentials'));
		expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO section_completion'));
	});
});
