/**
 * Web Vitals API Endpoint
 * Phase 8: Receive and store web vitals metrics from clients
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logWebVital } from '$lib/server/performance';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	try {
		const { vitals } = await request.json();

		if (!Array.isArray(vitals) || vitals.length === 0) {
			return json({ error: 'Invalid vitals data' }, { status: 400 });
		}

		const db = platform?.env?.DB;
		if (!db) {
			console.error('[WebVitals] Database not available');
			return json({ error: 'Database not available' }, { status: 500 });
		}

		// Get user ID if authenticated
		const userId = locals.user?.id;

		// Log each vital
		for (const vital of vitals) {
			await logWebVital(db, {
				userId,
				metricName: vital.metricName,
				metricValue: vital.metricValue,
				pagePath: vital.pagePath,
				userAgent: vital.userAgent,
				connectionType: vital.connectionType,
				deviceType: vital.deviceType
			});
		}

		return json({ success: true, count: vitals.length });
	} catch (error) {
		console.error('[WebVitals] Error logging vitals:', error);
		return json(
			{
				error: 'Failed to log web vitals'
			},
			{ status: 500 }
		);
	}
};
