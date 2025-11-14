/**
 * Accessibility Settings
 * Manage user accessibility preferences
 */

import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	// Load user's accessibility preferences
	const preferences = await db
		.prepare('SELECT * FROM user_accessibility_preferences WHERE user_id = ?')
		.bind(locals.user.id)
		.first();

	// Create default preferences if they don't exist
	if (!preferences) {
		await db
			.prepare('INSERT INTO user_accessibility_preferences (user_id) VALUES (?)')
			.bind(locals.user.id)
			.run();

		return {
			user: locals.user,
			preferences: {
				high_contrast_mode: 0,
				font_size: 'normal',
				reduce_motion: 0,
				screen_reader_mode: 0,
				keyboard_navigation_hints: 1,
				focus_indicators_enhanced: 0,
				color_blind_mode: null
			}
		};
	}

	return {
		user: locals.user,
		preferences
	};
};

export const actions: Actions = {
	updatePreferences: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const db = platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const highContrastMode = formData.get('high_contrast_mode') === 'true';
		const fontSize = formData.get('font_size') as string;
		const reduceMotion = formData.get('reduce_motion') === 'true';
		const screenReaderMode = formData.get('screen_reader_mode') === 'true';
		const keyboardNavigationHints = formData.get('keyboard_navigation_hints') === 'true';
		const focusIndicatorsEnhanced = formData.get('focus_indicators_enhanced') === 'true';
		const colorBlindMode = (formData.get('color_blind_mode') as string) || null;

		try {
			await db
				.prepare(
					`INSERT INTO user_accessibility_preferences (
						user_id, high_contrast_mode, font_size, reduce_motion,
						screen_reader_mode, keyboard_navigation_hints,
						focus_indicators_enhanced, color_blind_mode
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
					ON CONFLICT(user_id) DO UPDATE SET
						high_contrast_mode = ?,
						font_size = ?,
						reduce_motion = ?,
						screen_reader_mode = ?,
						keyboard_navigation_hints = ?,
						focus_indicators_enhanced = ?,
						color_blind_mode = ?`
				)
				.bind(
					locals.user.id,
					highContrastMode ? 1 : 0,
					fontSize,
					reduceMotion ? 1 : 0,
					screenReaderMode ? 1 : 0,
					keyboardNavigationHints ? 1 : 0,
					focusIndicatorsEnhanced ? 1 : 0,
					colorBlindMode,
					// For the UPDATE part
					highContrastMode ? 1 : 0,
					fontSize,
					reduceMotion ? 1 : 0,
					screenReaderMode ? 1 : 0,
					keyboardNavigationHints ? 1 : 0,
					focusIndicatorsEnhanced ? 1 : 0,
					colorBlindMode
				)
				.run();

			return { success: true, message: 'Preferences saved successfully' };
		} catch (err) {
			console.error('Failed to update preferences:', err);
			return fail(500, { error: 'Failed to update preferences' });
		}
	}
};
