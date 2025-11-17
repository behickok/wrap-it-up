#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const cwd = dirname(fileURLToPath(import.meta.url));
const sqlFile = resolve(cwd, 'seed-test-data.sql');

const args = process.argv.slice(2);
let dbName = process.env.npm_config_db;
const wranglerArgs = [];

for (let i = 0; i < args.length; i++) {
	const arg = args[i];
	if (arg === '--db') {
		dbName = args[i + 1];
		i++;
	} else if (arg === '--local') {
		wranglerArgs.push('--local');
	} else {
		wranglerArgs.push(arg);
	}
}

if (!dbName) {
	console.error('Missing --db <database-name> argument. Usage: npm run seed:test -- --db <name> [--local]');
	process.exit(1);
}

const result = spawnSync(
	'npx',
	['wrangler', 'd1', 'execute', dbName, ...wranglerArgs, `--file=${sqlFile}`],
	{
		stdio: 'inherit',
		shell: false
	}
);

if (result.status !== 0) {
	process.exit(result.status ?? 1);
}
