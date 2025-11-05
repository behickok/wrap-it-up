import { SECTIONS, type ReadinessScore, type SectionCompletion } from './types';

/**
 * Calculate the overall readiness score based on section completions
 * @param completions - Array of section completion data
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

	// Update with actual completion data
	completions.forEach((completion) => {
		if (sectionScores.hasOwnProperty(completion.section_name)) {
			sectionScores[completion.section_name] = completion.completion_percentage;
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

/**
 * Calculate completion percentage for a given section based on filled fields
 * @param data - The section data object
 * @param requiredFields - Array of field names that are considered required/important
 * @returns Completion percentage (0-100)
 */
export function calculateSectionCompletion(
	data: any,
	requiredFields?: string[]
): number {
	if (!data) return 0;

	const fields = requiredFields || Object.keys(data).filter((key) =>
		key !== 'id' && key !== 'user_id' && key !== 'created_at' && key !== 'updated_at'
	);

	if (fields.length === 0) return 0;

	let filledCount = 0;

	fields.forEach((field) => {
		const value = data[field];
		if (value !== null && value !== undefined && value !== '') {
			filledCount++;
		}
	});

	return Math.round((filledCount / fields.length) * 100);
}

/**
 * Get the completion status color based on percentage
 * @param percentage - Completion percentage
 * @returns Color class or code
 */
export function getCompletionColor(percentage: number): string {
	if (percentage >= 80) return 'green';
	if (percentage >= 50) return 'yellow';
	if (percentage >= 25) return 'orange';
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
