<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let { children } = $props();

	let loggingOut = $state(false);

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
			<div class="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
				{#if $page.data?.user}
					<div class="flex justify-center md:justify-start">
						<a href="/" class="group block">
							<div class="flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-white/40 bg-white/20 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:bg-white/30">
								<span class="text-3xl font-bold leading-none">{$page.data?.readinessScore?.total_score ?? 0}</span>
								<span class="mt-1 text-[10px] font-medium uppercase tracking-wider opacity-90">Points<br />Ready</span>
							</div>
						</a>
					</div>
				{:else}
					<div class="hidden md:block"></div>
				{/if}

				<a href="/" class="text-center no-underline group">
					<h1 class="text-3xl md:text-4xl font-bold tracking-tight transition-transform group-hover:scale-105">rhythm</h1>
					<!-- <p class="text-sm md:text-base opacity-90 mt-1">Your Life Planning Journey</p> -->
				</a>

				{#if $page.data?.user}
					<div class="flex items-center justify-center md:justify-end gap-3 md:gap-4">
						<a
							href="/journeys"
							class="btn btn-sm bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 shrink-0"
						>
							📚 Journeys
						</a>
						{#if $page.data?.isMentor}
							<a
								href="/mentor/dashboard"
								class="btn btn-sm bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 shrink-0"
							>
								👨‍🏫 Mentor
							</a>
						{/if}
						<span class="font-semibold text-sm md:text-base opacity-95 truncate max-w-[120px] md:max-w-none">@{$page.data.user.username}</span>
						<button
							onclick={handleLogout}
							disabled={loggingOut}
							class="btn btn-sm bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 shrink-0"
						>
							{loggingOut ? 'Logging out...' : 'Logout'}
						</button>
					</div>
				{:else}
					<nav class="flex justify-center md:justify-end gap-3 md:gap-4">
						<a
							href="/login"
							class={`px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-300 ${$page.url.pathname === '/login' ? 'bg-white/20 font-semibold' : ''}`}
						>
							Login
						</a>
						<a
							href="/register"
							class={`px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-300 ${$page.url.pathname === '/register' ? 'bg-white/20 font-semibold' : ''}`}
						>
							Register
						</a>
					</nav>
				{/if}
			</div>
		</div>
	</header>

	<main class="flex-1 max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 w-full">
		{@render children?.()}
	</main>

	<footer class="bg-gradient-to-br from-foreground/90 to-foreground text-primary-foreground text-center py-8 mt-12">
		<div class="max-w-7xl mx-auto px-8">
			<p class="text-lg font-medium mb-2">Wrap It Up</p>
			<p class="text-sm opacity-80">Organize your legacy with care and intention</p>
		</div>
	</footer>
</div>
