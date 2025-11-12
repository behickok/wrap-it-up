<script lang="ts">
import '../app.css';
import favicon from '$lib/assets/favicon.svg';
import { page } from '$app/stores';
import { goto } from '$app/navigation';

	let { children } = $props();

let loggingOut = $state(false);
const showReadinessCard = $derived(
	Boolean(
		$page.data?.user &&
			$page.url.pathname.startsWith('/journeys/') &&
			$page.url.pathname !== '/journeys' &&
			($page.data?.readinessScore?.total_score ?? 0) > 0
	)
);

	async function handleLogout() {
		loggingOut = true;
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			goto('/login');
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			loggingOut = false;
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Wrap It Up - End of Life Planning Workbook</title>
</svelte:head>

<div class="min-h-screen flex flex-col bg-background">
	<header class="text-primary-foreground shadow-xl relative overflow-hidden" style="background: linear-gradient(135deg, #e07b39 0%, #f4a261 50%, #e9c46a 100%);">
		<!-- Decorative background pattern -->
		<div class="absolute inset-0 opacity-10">
			<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
				<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
					<circle cx="20" cy="20" r="1" fill="white" />
				</pattern>
				<rect width="100%" height="100%" fill="url(#grid)" />
			</svg>
		</div>

		<div class="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6 relative z-10">
			<div class="flex flex-wrap items-center gap-4 md:gap-6">
				<a href="/" class="flex items-center gap-3 text-primary-foreground no-underline group">
					<div class="h-12 w-12 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-2xl shadow-lg group-hover:bg-white/30 transition-all">
						〰️
					</div>
					<div>
						<p class="text-lg font-semibold leading-tight tracking-wide uppercase">Rhythm</p>
						<!-- <p class="text-xs opacity-80">Plan every milestone with clarity</p> -->
					</div>
				</a>

				{#if $page.data?.user}
					<nav class="flex flex-1 flex-wrap items-center justify-center md:justify-start gap-2">
						<a
							href="/"
							class={`nav-chip ${$page.url.pathname === '/' ? 'nav-chip-active' : ''}`}
						>
							🏠 Dashboard
						</a>
						<a
							href="/journeys"
							class={`nav-chip ${$page.url.pathname.startsWith('/journeys') ? 'nav-chip-active' : ''}`}
						>
							📚 Journeys
						</a>
						{#if $page.data?.isMentor}
							<a
								href="/mentor/dashboard"
								class={`nav-chip ${$page.url.pathname.startsWith('/mentor') ? 'nav-chip-active' : ''}`}
							>
								👨‍🏫 Mentor
							</a>
						{/if}
					</nav>

					<div class="flex items-center gap-3 md:gap-4 ml-auto">
						<div class="hidden sm:flex flex-col text-right">
							<span class="text-xs uppercase tracking-wider opacity-75">Signed in as</span>
							<span class="font-semibold text-sm md:text-base">@{$page.data.user.username}</span>
						</div>
						<button
							onclick={handleLogout}
							disabled={loggingOut}
							class="btn btn-sm bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
						>
							{loggingOut ? 'Logging out...' : 'Logout'}
						</button>
					</div>
				{:else}
					<nav class="flex-1 flex justify-end items-center gap-3 md:gap-4">
						<a
							href="/login"
							class={`nav-chip ${$page.url.pathname === '/login' ? 'nav-chip-active' : ''}`}
						>
							Login
						</a>
						<a
							href="/register"
							class={`nav-chip ${$page.url.pathname === '/register' ? 'nav-chip-active' : ''}`}
						>
							Register
						</a>
					</nav>
				{/if}
			</div>
		</div>
	</header>

	<main class="flex-1 max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 w-full">
		{#if showReadinessCard}
			<div class="flex justify-end mb-6">
				<div class="readiness-card shadow-2xl border border-base-200/60 bg-base-100/90 backdrop-blur rounded-2xl px-6 py-4 w-full sm:w-auto max-w-md">
					<div class="flex items-center justify-between gap-6">
						<div>
							<p class="text-xs uppercase tracking-[0.2em] text-base-content/60">Journey readiness</p>
							<div class="flex items-baseline gap-2">
								<span class="text-4xl font-bold text-base-content">{$page.data?.readinessScore?.total_score ?? 0}</span>
								<span class="text-sm text-base-content/70">points</span>
							</div>
						</div>
						<a href="/journeys" class="btn btn-sm btn-outline">View journeys</a>
					</div>
				</div>
			</div>
		{/if}
		{@render children?.()}
	</main>

	<footer class="bg-gradient-to-br from-foreground/90 to-foreground text-primary-foreground text-center py-8 mt-12">
		<div class="max-w-7xl mx-auto px-8">
			<p class="text-lg font-medium mb-2">Wrap It Up</p>
			<p class="text-sm opacity-80">Organize your legacy with care and intention</p>
		</div>
	</footer>
</div>

<style>
	.nav-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 1rem;
		border-radius: 9999px;
		border: 1px solid rgba(255, 255, 255, 0.35);
		background-color: rgba(255, 255, 255, 0.12);
		color: inherit;
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
		transition: background-color 150ms ease, transform 150ms ease, border-color 150ms ease;
	}

	.nav-chip:hover {
		background-color: rgba(255, 255, 255, 0.25);
		transform: translateY(-1px);
	}

	.nav-chip-active {
		background-color: rgba(255, 255, 255, 0.35);
		border-color: rgba(255, 255, 255, 0.65);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
	}
</style>
