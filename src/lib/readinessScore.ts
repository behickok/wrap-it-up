import { SECTIONS, type ReadinessScore, type SectionCompletion } from './types';
import {
	calculateContactsScore,
	calculateCredentialsScore,
	calculateEmploymentScore,
	calculateFieldBasedScore,
	calculateFinancialScore,
	calculateInsuranceScore,
	calculatePetsScore,
	SECTION_FIELDS
} from './scoringRules';

/**
 * Calculate the overall readiness score based on section completions
 * Now uses point-based scoring (0-100) instead of percentage-based
 * @param completions - Array of section completion data (with scores 0-100)
 * @returns ReadinessScore object with total score and section breakdown
 */
export function calculateReadinessScore(completions: SectionCompletion[]): ReadinessScore {
	const sectionScores: { [key: string]: number } = {};
	let totalWeight = 0;
	let weightedScore = 0;

	// Initialize all sections with 0
	SECTIONS.forEach((section) => {
		sectionScores[section.id] = 0;
		totalWeight += section.weight;
	});

	// Update with actual score data
	completions.forEach((completion) => {
		if (sectionScores.hasOwnProperty(completion.section_name)) {
			sectionScores[completion.section_name] = completion.score;
		}
	});

	// Calculate weighted score
	SECTIONS.forEach((section) => {
		const sectionScore = sectionScores[section.id] || 0;
		weightedScore += (sectionScore * section.weight) / 100;
	});

	const totalScore = Math.round((weightedScore / totalWeight) * 100);

	return {
		total_score: totalScore,
		sections: sectionScores
	};
}

function calculateSimpleListScore(items: any[], importantKeys: readonly string[] = []): number {
	if (!Array.isArray(items) || items.length === 0) return 0;

	let score = 30; // base for having at least one entry
	score += Math.min(items.length * 10, 30); // diversity bonus

	let completeCount = 0;
	for (const item of items) {
		const isComplete = importantKeys.every((key) => {
			const value = (item as any)?.[key];
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

/**
 * Calculate section score using point-based system
 * Routes to appropriate scoring function based on section type
 * @param sectionName - The section identifier
 * @param data - The section data (can be single object or array)
 * @returns Score (0-100 points)
 */
export function calculateSectionScore(sectionName: string, data: any): number {
	if (!data) return 0;

	// Variable-length sections with specialized scoring
	switch (sectionName) {
		case 'credentials':
			return Array.isArray(data)
				? calculateCredentialsScore(data).total
				: calculateCredentialsScore([data]).total;

		case 'pets':
			return Array.isArray(data) ? calculatePetsScore(data) : calculatePetsScore([data]);

		case 'contacts':
			return Array.isArray(data)
				? calculateContactsScore(data)
				: calculateContactsScore([data]);

		case 'insurance':
			return Array.isArray(data)
				? calculateInsuranceScore(data)
				: calculateInsuranceScore([data]);

		case 'financial':
			return Array.isArray(data)
				? calculateFinancialScore(data)
				: calculateFinancialScore([data]);

		case 'employment':
			return Array.isArray(data)
				? calculateEmploymentScore(data)
				: calculateEmploymentScore([data]);

		// Fixed-field sections with field-based scoring
		case 'personal':
		case 'medical':
		case 'residence':
		case 'legal':
		case 'final-days':
		case 'obituary':
		case 'after-death':
		case 'funeral':
		case 'conclusion':
		case 'marriage_license':
		case 'prenup':
		case 'joint_accounts':
		case 'name_change':
		case 'venue':
		case 'home_setup':
			const fields = SECTION_FIELDS[sectionName];
			if (fields) {
				const criticalFields = fields.critical ? [...fields.critical] : [];
				const importantFields = fields.important ? [...fields.important] : [];
				const optionalFields = fields.optional ? [...fields.optional] : [];
				return calculateFieldBasedScore(
					data,
					criticalFields,
					importantFields,
					optionalFields
				);
			}
			return 0;

		// Sections not yet implemented with specific scoring
		case 'family':
		case 'property':
			// Use simple field-based scoring as fallback
			return calculateFieldBasedScore(data, [], Object.keys(data), []);

		case 'vendors':
			return calculateSimpleListScore(Array.isArray(data) ? data : [], [
				'business_name',
				'vendor_type',
				'status',
				'next_payment_due'
			]);

		case 'guest_list':
			return calculateSimpleListScore(Array.isArray(data) ? data : [], [
				'guest_name',
				'party_size',
				'rsvp_status'
			]);

		case 'registry':
			return calculateSimpleListScore(Array.isArray(data) ? data : [], [
				'item_name',
				'retailer',
				'status'
			]);

		default:
			return 0;
	}
}

/**
 * Get the completion status color based on score
 * @param score - Completion score (0-100 points)
 * @returns Color class or code
 */
export function getCompletionColor(score: number): string {
	if (score >= 80) return 'green';
	if (score >= 50) return 'yellow';
	if (score >= 25) return 'orange';
	return 'red';
}

/**
 * Get a motivational message based on the overall readiness score
 * @param score - Overall readiness score (0-100)
 * @returns Motivational message
 */
export function getMotivationalMessage(score: number): string {
	if (score >= 90) return "Outstanding! You're well-prepared for the future.";
	if (score >= 75) return "Great progress! You're almost there.";
	if (score >= 50) return "Good start! Keep filling out the remaining sections.";
	if (score >= 25) return "You're on your way. Every step counts!";
	return "Welcome! Let's start organizing your important information.";
}
