<script lang="ts">
	/**
	 * Offline Page
	 * Shown when user is offline and requests a page not in cache
	 */

	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let isOnline = $state(browser ? navigator.onLine : true);

	onMount(() => {
		const updateOnlineStatus = () => {
			isOnline = navigator.onLine;

			if (isOnline) {
				// Reload the page when back online
				window.location.reload();
			}
		};

		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);

		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
		};
	});
</script>

<svelte:head>
	<title>Offline - Wrap It Up</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-base-200 px-4">
	<div class="card bg-base-100 shadow-xl max-w-md w-full">
		<div class="card-body text-center">
			<!-- Offline Icon -->
			<div class="mb-4">
				<svg
					class="w-24 h-24 mx-auto text-base-content/30"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
					></path>
				</svg>
			</div>

			<!-- Title and Message -->
			<h2 class="card-title text-2xl justify-center mb-2">You're Offline</h2>
			<p class="text-base-content/70 mb-4">
				It looks like you've lost your internet connection. Some features may not be available
				until you're back online.
			</p>

			<!-- Status Indicator -->
			<div class="mb-4">
				{#if isOnline}
					<div class="alert alert-success">
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
						<span>You're back online! Refreshing...</span>
					</div>
				{:else}
					<div class="alert alert-warning">
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
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
						<span>No internet connection</span>
					</div>
				{/if}
			</div>

			<!-- Actions -->
			<div class="card-actions justify-center">
				<button class="btn btn-primary" onclick={() => window.location.reload()}>
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
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
					Try Again
				</button>
			</div>

			<!-- Helpful Tips -->
			<div class="mt-6 text-left">
				<h3 class="font-semibold mb-2">While you wait:</h3>
				<ul class="text-sm text-base-content/70 space-y-1">
					<li>• Check your Wi-Fi or mobile data connection</li>
					<li>• Try moving to an area with better signal</li>
					<li>• Restart your router if using Wi-Fi</li>
					<li>• Some cached content may still be available</li>
				</ul>
			</div>
		</div>
	</div>
</div>
