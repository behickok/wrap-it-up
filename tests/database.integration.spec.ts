import Database from 'better-sqlite3';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { load as homePageLoad } from '../src/routes/+page.server';
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

	it('loads the home page data for authenticated users without throwing', async () => {
		const result = (await homePageLoad({
			locals: { user: { id: 1 } },
			platform: { env: { DB: d1 } },
		} as any)) as NonVoidLoadResult;

		expect(result.user?.id).toBe(1);
		expect(Array.isArray(result.featuredJourneys)).toBe(true);
		expect(Array.isArray(result.enrolledJourneys)).toBe(true);
		expect(Array.isArray(result.availableJourneys)).toBe(true);
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
