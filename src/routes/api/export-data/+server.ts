import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSectionDataBySlugs } from '$lib/server/genericSectionData';
import { loadLegacySectionData, type LegacySectionSlug } from '$lib/server/legacySectionLoaders';

const EXPORT_SECTIONS: Array<{ slug: LegacySectionSlug; key: string }> = [
	{ slug: 'personal', key: 'personalInfo' },
	{ slug: 'credentials', key: 'credentials' },
	{ slug: 'pets', key: 'pets' },
	{ slug: 'contacts', key: 'keyContacts' },
	{ slug: 'medical', key: 'medicalInfo' },
	{ slug: 'physicians', key: 'physicians' },
	{ slug: 'employment', key: 'employment' },
	{ slug: 'residence', key: 'primaryResidence' },
	{ slug: 'vehicles', key: 'vehicles' },
	{ slug: 'insurance', key: 'insurance' },
	{ slug: 'financial', key: 'bankAccounts' },
	{ slug: 'legal', key: 'legalDocuments' },
	{ slug: 'final-days', key: 'finalDays' },
	{ slug: 'obituary', key: 'obituary' },
	{ slug: 'after-death', key: 'afterDeath' },
	{ slug: 'funeral', key: 'funeral' }
];

const toArray = (value: any): any[] => {
	if (Array.isArray(value)) return value;
	if (value === null || value === undefined) return [];
	return [value];
};

export const GET: RequestHandler = async ({ platform, locals }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const db = platform?.env?.DB;
	if (!db) {
		return json({ error: 'Database not available' }, { status: 500 });
	}

	try {
		const slugList = EXPORT_SECTIONS.map(({ slug }) => slug);
		const genericSectionData = await getSectionDataBySlugs(db, user.id, slugList);

		const dataEntries = await Promise.all(
			EXPORT_SECTIONS.map(async ({ slug, key }) => {
				const record = genericSectionData[slug];
				const value = record ? record.data : await loadLegacySectionData(db, user.id, slug);
				return [key, toArray(value)];
			})
		);

		const exportData = Object.fromEntries(dataEntries);

		return json({
			user: {
				username: user.username,
				email: user.email
			},
			data: exportData,
			exportedAt: new Date().toISOString()
		});
	} catch (error) {
		console.error('Error fetching user data:', error);
		return json({ error: 'Failed to fetch user data' }, { status: 500 });
	}
};
