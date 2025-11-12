/**
 * Generic field-based scoring system
 * Calculates section scores based on field importance levels and completion
 */

import type { ParsedSectionField, FieldImportanceLevel } from './types';

// Point values for each importance level
const IMPORTANCE_POINTS: Record<FieldImportanceLevel, number> = {
	critical: 40, // Critical fields are worth 40 points each
	important: 30, // Important fields are worth 30 points each
	optional: 10   // Optional fields are worth 10 points each
};

/**
 * Calculate score for a single section based on field completion
 * @param fields - Array of fields for the section
 * @param data - User's data for the section (field_name: value pairs)
 * @returns Score from 0-100
 */
export function calculateGenericSectionScore(
	fields: ParsedSectionField[],
	data: Record<string, any>
): number {
	if (fields.length === 0) return 0;

	// Calculate total possible points
	let totalPossiblePoints = 0;
	fields.forEach(field => {
		totalPossiblePoints += IMPORTANCE_POINTS[field.importance_level];
	});

	if (totalPossiblePoints === 0) return 0;

	// Calculate earned points
	let earnedPoints = 0;
	fields.forEach(field => {
		if (isFieldCompleted(field, data[field.field_name])) {
			earnedPoints += IMPORTANCE_POINTS[field.importance_level];
		}
	});

	// Convert to 0-100 scale
	return Math.round((earnedPoints / totalPossiblePoints) * 100);
}

/**
 * Check if a field is completed based on its type and value
 * @param field - The field definition
 * @param value - The field value
 * @returns true if field is considered complete
 */
export function isFieldCompleted(field: ParsedSectionField, value: any): boolean {
	// Null/undefined is never complete
	if (value === null || value === undefined) {
		return false;
	}

	switch (field.field_type.type_name) {
		case 'checkbox':
			// Checkbox is complete if it's explicitly true or false
			return typeof value === 'boolean';

		case 'multiselect':
			// Multiselect is complete if array has items
			return Array.isArray(value) && value.length > 0;

		case 'number':
		case 'currency':
		case 'rating':
			// Number fields are complete if they have a valid number
			return typeof value === 'number' && !isNaN(value);

		case 'file':
			// File is complete if there's a file path/URL
			return typeof value === 'string' && value.trim() !== '';

		case 'text':
		case 'textarea':
		case 'email':
		case 'phone':
		case 'url':
		case 'date':
		case 'datetime':
		case 'select':
		case 'radio':
		default:
			// Text-based fields are complete if they have non-empty strings
			return typeof value === 'string' && value.trim() !== '';
	}
}

/**
 * Count completed fields in a section
 * @param fields - Array of fields for the section
 * @param data - User's data for the section
 * @returns Object with completed and total counts
 */
export function countCompletedFields(
	fields: ParsedSectionField[],
	data: Record<string, any>
): { completed: number; total: number } {
	const total = fields.length;
	const completed = fields.filter(field =>
		isFieldCompleted(field, data[field.field_name])
	).length;

	return { completed, total };
}

/**
 * Calculate score breakdown by importance level
 * @param fields - Array of fields for the section
 * @param data - User's data for the section
 * @returns Breakdown of points by importance level
 */
export function calculateScoreBreakdown(
	fields: ParsedSectionField[],
	data: Record<string, any>
): {
	critical: { completed: number; total: number; points: number; maxPoints: number };
	important: { completed: number; total: number; points: number; maxPoints: number };
	optional: { completed: number; total: number; points: number; maxPoints: number };
} {
	const breakdown = {
		critical: { completed: 0, total: 0, points: 0, maxPoints: 0 },
		important: { completed: 0, total: 0, points: 0, maxPoints: 0 },
		optional: { completed: 0, total: 0, points: 0, maxPoints: 0 }
	};

	fields.forEach(field => {
		const level = field.importance_level;
		breakdown[level].total++;
		breakdown[level].maxPoints += IMPORTANCE_POINTS[level];

		if (isFieldCompleted(field, data[field.field_name])) {
			breakdown[level].completed++;
			breakdown[level].points += IMPORTANCE_POINTS[level];
		}
	});

	return breakdown;
}

/**
 * Get list of incomplete required fields
 * @param fields - Array of fields for the section
 * @param data - User's data for the section
 * @returns Array of field labels that are required but incomplete
 */
export function getIncompleteRequiredFields(
	fields: ParsedSectionField[],
	data: Record<string, any>
): string[] {
	return fields
		.filter(field => field.is_required && !isFieldCompleted(field, data[field.field_name]))
		.map(field => field.field_label);
}

/**
 * Get completion suggestions for improving score
 * @param fields - Array of fields for the section
 * @param data - User's data for the section
 * @returns Array of suggestions ordered by importance
 */
export function getCompletionSuggestions(
	fields: ParsedSectionField[],
	data: Record<string, any>
): Array<{ field: string; importance: FieldImportanceLevel; points: number }> {
	const incomplete = fields.filter(field =>
		!isFieldCompleted(field, data[field.field_name])
	);

	// Sort by importance (critical first, then important, then optional)
	const importanceOrder = { critical: 0, important: 1, optional: 2 };
	incomplete.sort((a, b) =>
		importanceOrder[a.importance_level] - importanceOrder[b.importance_level]
	);

	return incomplete.map(field => ({
		field: field.field_label,
		importance: field.importance_level,
		points: IMPORTANCE_POINTS[field.importance_level]
	}));
}

/**
 * For list-based sections (like credentials, contacts, etc.)
 * Calculate score based on number and completeness of items
 */
export function calculateListBasedScore(
	items: any[],
	importantKeys: string[] = []
): number {
	if (!Array.isArray(items) || items.length === 0) return 0;

	// Base score for having at least one entry
	let score = 30;

	// Diversity bonus: more items = higher score (up to 30 points)
	score += Math.min(items.length * 10, 30);

	// Completeness bonus: items with all important fields filled (up to 40 points)
	let completeCount = 0;
	for (const item of items) {
		const isComplete = importantKeys.every(key => {
			const value = item?.[key];
			if (value === null || value === undefined) return false;
			if (typeof value === 'number') return true;
			return value.toString().trim() !== '';
		});
		if (isComplete) {
			completeCount++;
		}
	}

	score += Math.min(completeCount * 10, 40);
	return Math.min(score, 100);
}
