import Database from 'better-sqlite3';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { load } from '../src/routes/+page.server';
import { GET as exportDataGet } from '../src/routes/api/export-data/+server';

type SqliteInstance = InstanceType<typeof Database>;
type D1Like = ReturnType<typeof wrapSqliteAsD1>;
type LoadResult = Awaited<ReturnType<typeof load>>;
type NonVoidLoadResult = Exclude<LoadResult, void>;

function wrapSqliteAsD1(db: SqliteInstance) {
	return {
		prepare(query: string) {
			const statement = db.prepare(query);

			const withParams = (params: any[]) => ({
				first: async () => statement.get(...params) ?? null,
				all: async () => ({ results: statement.all(...params) }),
				run: async () => {
					statement.run(...params);
					return { success: true };
				}
			});

			return {
				bind: (...params: any[]) => withParams(params),
				first: async () => statement.get() ?? null,
				all: async () => ({ results: statement.all() }),
				run: async () => {
					statement.run();
					return { success: true };
				}
			};
		}
	};
}

function execSqlScript(db: SqliteInstance, script: string) {
	let buffer = '';
	for (const line of script.split('\n')) {
		const trimmed = line.trim();
		buffer += line + '\n';

		if (trimmed.endsWith(';')) {
			try {
				db.exec(buffer);
			} catch (error) {
				console.error('Failed SQL statement:\n', buffer);
				throw error;
			}
			buffer = '';
		}
	}

	if (buffer.trim().length > 0) {
		try {
			db.exec(buffer);
		} catch (error) {
			console.error('Failed SQL statement:\n', buffer);
			throw error;
		}
	}
}

function createSeededDatabase() {
	const dir = mkdtempSync(join(tmpdir(), 'wrap-it-up-db-'));
	const file = join(dir, 'integration.sqlite');
	const sqlite = new Database(file);

	const schema = readFileSync('schema.sql', 'utf-8');
	const seed = readFileSync('scripts/sample-data-user-1.sql', 'utf-8');

	execSqlScript(sqlite, schema);
	execSqlScript(sqlite, seed);

	return {
		db: wrapSqliteAsD1(sqlite),
		dispose: () => {
			sqlite.close();
			rmSync(dir, { recursive: true, force: true });
		}
	};
}

describe('Database integration', () => {
	let d1: D1Like;
	let cleanup: () => void;

	beforeAll(() => {
		const { db, dispose } = createSeededDatabase();
		d1 = db;
		cleanup = dispose;
	});

	afterAll(() => {
		cleanup?.();
	});

	it('loads dashboard data from the seeded dataset', async () => {
		const result = (await load({
			locals: { user: { id: 1 } },
			platform: { env: { DB: d1 } },
			params: { slug: 'care' }
		} as any)) as NonVoidLoadResult;

		expect(result.sectionData.personal.legal_name).toBe('Jordan Avery Wells');
		expect(result.sectionData.credentials).toHaveLength(3);
		expect(result.sectionData['final-days'].who_around).toContain('Casey');
	});

	it('exports a full snapshot of user data', async () => {
		const response = await exportDataGet({
			platform: { env: { DB: d1 } },
			locals: {
				user: {
					id: 1,
					username: 'jordan',
					email: 'jordan@example.com'
				}
			}
		} as any);

		expect(response.status).toBe(200);
		const payload = await response.json();

		expect(Array.isArray(payload.data.personalInfo)).toBe(true);
		expect(payload.data.personalInfo.some((entry: any) => entry.legal_name === 'Jordan Avery Wells')).toBe(true);
		expect(payload.data.credentials).toHaveLength(3);
		expect(payload.data.keyContacts).toHaveLength(3);
		expect(payload.user.username).toBe('jordan');
		expect(typeof payload.exportedAt).toBe('string');
	});
});
