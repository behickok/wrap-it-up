<script lang="ts">
	/**
	 * Accessibility Settings Page
	 * Customize accessibility preferences for better user experience
	 */

	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Font size options
	const FONT_SIZES = [
		{ value: 'small', label: 'Small', demo: 'text-sm' },
		{ value: 'normal', label: 'Normal', demo: 'text-base' },
		{ value: 'large', label: 'Large', demo: 'text-lg' },
		{ value: 'x-large', label: 'Extra Large', demo: 'text-xl' }
	] as const;

	type FontSizeOption = (typeof FONT_SIZES)[number]['value'];
	type PreferencesState = {
		high_contrast_mode: boolean;
		font_size: FontSizeOption;
		reduce_motion: boolean;
		screen_reader_mode: boolean;
		keyboard_navigation_hints: boolean;
		focus_indicators_enhanced: boolean;
		color_blind_mode: string;
	};

	const FONT_SIZE_VALUES: Record<FontSizeOption, string> = {
		small: '14px',
		normal: '16px',
		large: '18px',
		'x-large': '20px'
	};

	// Form state
	let preferences: PreferencesState = $state({
		high_contrast_mode: data.preferences.high_contrast_mode === 1,
		font_size: (data.preferences.font_size || 'normal') as FontSizeOption,
		reduce_motion: data.preferences.reduce_motion === 1,
		screen_reader_mode: data.preferences.screen_reader_mode === 1,
		keyboard_navigation_hints: data.preferences.keyboard_navigation_hints === 1,
		focus_indicators_enhanced: data.preferences.focus_indicators_enhanced === 1,
		color_blind_mode: data.preferences.color_blind_mode || ''
	});

	// Color blind modes
	const COLOR_BLIND_MODES = [
		{ value: '', label: 'None (Full Color)' },
		{ value: 'protanopia', label: 'Protanopia (Red-Blind)' },
		{ value: 'deuteranopia', label: 'Deuteranopia (Green-Blind)' },
		{ value: 'tritanopia', label: 'Tritanopia (Blue-Blind)' }
	];

	// Apply preferences in real-time
	$effect(() => {
		if (browser) {
			const root = document.documentElement;

			// High contrast mode
			root.classList.toggle('high-contrast', preferences.high_contrast_mode);

			// Font size
			root.setAttribute('data-font-size', preferences.font_size);
			root.style.fontSize = FONT_SIZE_VALUES[preferences.font_size];

			// Reduce motion
			root.classList.toggle('reduce-motion', preferences.reduce_motion);

			// Enhanced focus indicators
			root.classList.toggle('focus-enhanced', preferences.focus_indicators_enhanced);

			// Color blind mode
			root.setAttribute('data-color-blind-mode', preferences.color_blind_mode || '');
		}
	});
</script>

<svelte:head>
	<title>Accessibility Settings - Wrap It Up</title>
	<style>
		/* High Contrast Mode */
		:global(.high-contrast) {
			--tw-border-opacity: 1;
		}

		:global(.high-contrast *) {
			border-width: 2px !important;
		}

		/* Reduce Motion */
		:global(.reduce-motion *) {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}

		/* Enhanced Focus Indicators */
		:global(.focus-enhanced *:focus) {
			outline: 3px solid oklch(var(--p)) !important;
			outline-offset: 3px !important;
		}

		/* Color Blind Modes - Simplified filters */
		:global([data-color-blind-mode='protanopia']) {
			filter: grayscale(0.3) sepia(0.2);
		}

		:global([data-color-blind-mode='deuteranopia']) {
			filter: grayscale(0.3) hue-rotate(20deg);
		}

		:global([data-color-blind-mode='tritanopia']) {
			filter: grayscale(0.2) hue-rotate(-30deg);
		}
	</style>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Accessibility Settings</h1>
		<p class="text-base-content/70">
			Customize your experience to match your needs and preferences
		</p>
	</div>

	<!-- Success Message -->
	{#if form?.success}
		<div class="alert alert-success mb-6" role="alert">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="stroke-current shrink-0 h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span>{form.message}</span>
		</div>
	{/if}

	<!-- Settings Form -->
	<form method="POST" action="?/updatePreferences" use:enhance>
		<div class="space-y-6">
			<!-- Visual Settings -->
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<h2 class="card-title mb-4">Visual Settings</h2>

					<!-- High Contrast Mode -->
					<div class="form-control">
						<label class="label cursor-pointer justify-start gap-4">
							<input
								type="checkbox"
								name="high_contrast_mode"
								class="toggle toggle-primary"
								bind:checked={preferences.high_contrast_mode}
								value="true"
							/>
							<div class="flex-1">
								<span class="label-text font-medium">High Contrast Mode</span>
								<p class="text-sm text-base-content/60 mt-1">
									Increases contrast between text and backgrounds for better readability
								</p>
							</div>
						</label>
					</div>

					<div class="divider"></div>

					<!-- Font Size -->
					<div class="form-control">
						<label class="label" for="font_size">
							<span class="label-text font-medium">Text Size</span>
						</label>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
							{#each FONT_SIZES as size}
								<label
									class="label cursor-pointer justify-start gap-3 p-4 rounded-lg border-2 {preferences.font_size ===
									size.value
										? 'border-primary bg-primary/10'
										: 'border-base-300'}"
								>
									<input
										type="radio"
										name="font_size"
										class="radio radio-primary"
										value={size.value}
										bind:group={preferences.font_size}
									/>
									<div>
										<div class="font-medium">{size.label}</div>
										<div class="{size.demo} text-base-content/60">Aa</div>
									</div>
								</label>
							{/each}
						</div>
						<p class="text-sm text-base-content/60 mt-2">
							Current size: <span class={FONT_SIZES.find((s) => s.value === preferences.font_size)
									?.demo}>
								Sample text
							</span>
						</p>
					</div>

					<div class="divider"></div>

					<!-- Color Blind Mode -->
					<div class="form-control">
						<label class="label" for="color_blind_mode">
							<span class="label-text font-medium">Color Vision Adjustment</span>
						</label>
						<select
							id="color_blind_mode"
							name="color_blind_mode"
							class="select select-bordered"
							bind:value={preferences.color_blind_mode}
						>
							{#each COLOR_BLIND_MODES as mode}
								<option value={mode.value}>{mode.label}</option>
							{/each}
						</select>
						<p class="text-sm text-base-content/60 mt-2">
							Adjusts colors to accommodate color vision deficiencies
						</p>
					</div>
				</div>
			</div>

			<!-- Motion & Animation -->
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<h2 class="card-title mb-4">Motion & Animation</h2>

					<div class="form-control">
						<label class="label cursor-pointer justify-start gap-4">
							<input
								type="checkbox"
								name="reduce_motion"
								class="toggle toggle-primary"
								bind:checked={preferences.reduce_motion}
								value="true"
							/>
							<div class="flex-1">
								<span class="label-text font-medium">Reduce Motion</span>
								<p class="text-sm text-base-content/60 mt-1">
									Minimizes animations and transitions for users sensitive to motion
								</p>
							</div>
						</label>
					</div>
				</div>
			</div>

			<!-- Navigation & Interaction -->
			<div class="card bg-base-100 shadow">
				<div class="card-body">
					<h2 class="card-title mb-4">Navigation & Interaction</h2>

					<!-- Screen Reader Mode -->
					<div class="form-control">
						<label class="label cursor-pointer justify-start gap-4">
							<input
								type="checkbox"
								name="screen_reader_mode"
								class="toggle toggle-primary"
								bind:checked={preferences.screen_reader_mode}
								value="true"
							/>
							<div class="flex-1">
								<span class="label-text font-medium">Screen Reader Optimization</span>
								<p class="text-sm text-base-content/60 mt-1">
									Optimizes page structure and labels for screen readers
								</p>
							</div>
						</label>
					</div>

					<div class="divider"></div>

					<!-- Keyboard Navigation Hints -->
					<div class="form-control">
						<label class="label cursor-pointer justify-start gap-4">
							<input
								type="checkbox"
								name="keyboard_navigation_hints"
								class="toggle toggle-primary"
								bind:checked={preferences.keyboard_navigation_hints}
								value="true"
							/>
							<div class="flex-1">
								<span class="label-text font-medium">Keyboard Navigation Hints</span>
								<p class="text-sm text-base-content/60 mt-1">
									Shows helpful tooltips for keyboard shortcuts
								</p>
							</div>
						</label>
					</div>

					<div class="divider"></div>

					<!-- Enhanced Focus Indicators -->
					<div class="form-control">
						<label class="label cursor-pointer justify-start gap-4">
							<input
								type="checkbox"
								name="focus_indicators_enhanced"
								class="toggle toggle-primary"
								bind:checked={preferences.focus_indicators_enhanced}
								value="true"
							/>
							<div class="flex-1">
								<span class="label-text font-medium">Enhanced Focus Indicators</span>
								<p class="text-sm text-base-content/60 mt-1">
									Makes keyboard focus indicators more visible
								</p>
							</div>
						</label>
					</div>
				</div>
			</div>

			<!-- Keyboard Shortcuts Reference -->
			<div class="card bg-info/10">
				<div class="card-body">
					<h3 class="font-semibold mb-3">⌨️ Keyboard Shortcuts</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
						<div>
							<kbd class="kbd kbd-sm">Tab</kbd> - Navigate forward
						</div>
						<div>
							<kbd class="kbd kbd-sm">Shift</kbd> + <kbd class="kbd kbd-sm">Tab</kbd> - Navigate backward
						</div>
						<div>
							<kbd class="kbd kbd-sm">Enter</kbd> - Activate buttons/links
						</div>
						<div>
							<kbd class="kbd kbd-sm">Esc</kbd> - Close modals/dialogs
						</div>
						<div>
							<kbd class="kbd kbd-sm">/</kbd> - Focus search (on supported pages)
						</div>
						<div>
							<kbd class="kbd kbd-sm">?</kbd> - Show keyboard shortcuts
						</div>
					</div>
				</div>
			</div>

			<!-- Save Button -->
			<div class="flex justify-end gap-4">
				<a href="/settings" class="btn btn-ghost">Cancel</a>
				<button type="submit" class="btn btn-primary">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 mr-2"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					Save Preferences
				</button>
			</div>
		</div>
	</form>

	<!-- WCAG Compliance Badge -->
	<div class="mt-8 text-center">
		<div class="badge badge-outline badge-lg gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
				/>
			</svg>
			WCAG 2.1 AA Compliant
		</div>
		<p class="text-xs text-base-content/60 mt-2">
			We're committed to making Wrap It Up accessible to everyone
		</p>
	</div>
</div>
