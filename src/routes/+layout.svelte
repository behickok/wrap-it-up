<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';

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

<div class="min-h-screen flex flex-col">
	<header class="bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg">
		<div class="max-w-7xl mx-auto px-8 py-4">
			<div class="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
				{#if $page.data?.user}
					<div class="flex justify-center md:justify-start">
						<div class="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30 flex flex-col items-center justify-center shadow-lg">
							<span class="text-2xl font-bold leading-none">{$page.data?.readinessScore?.total_score || 0}%</span>
							<span class="text-xs uppercase tracking-wide opacity-90">Ready</span>
						</div>
					</div>
				{:else}
					<div class="hidden md:block"></div>
				{/if}

				<div class="text-center">
					<h1 class="text-3xl font-semibold">Wrap It Up</h1>
					<p class="text-sm opacity-90 mt-1">Your End of Life Planning Workbook</p>
				</div>

				{#if $page.data?.user}
					<div class="flex items-center justify-center md:justify-end gap-4">
						<span class="font-semibold text-sm opacity-95">@{$page.data.user.username}</span>
						<Button
							variant="secondary"
							size="sm"
							onclick={handleLogout}
							disabled={loggingOut}
							class="bg-white/20 hover:bg-white/30 border border-white/30"
						>
							{loggingOut ? 'Logging out...' : 'Logout'}
						</Button>
					</div>
				{:else}
					<nav class="flex justify-center md:justify-end gap-4">
						<a
							href="/login"
							class={`px-4 py-2 rounded-md hover:bg-white/20 transition-colors ${$page.url.pathname === '/login' ? 'bg-white/20' : ''}`}
						>
							Login
						</a>
						<a
							href="/register"
							class={`px-4 py-2 rounded-md hover:bg-white/20 transition-colors ${$page.url.pathname === '/register' ? 'bg-white/20' : ''}`}
						>
							Register
						</a>
					</nav>
				{/if}
			</div>
		</div>
	</header>

	<main class="flex-1 max-w-7xl mx-auto px-8 py-8 w-full">
		{@render children?.()}
	</main>

	<footer class="bg-slate-800 text-white text-center py-6">
		<p class="opacity-80">Wrap It Up - Organize your legacy with care</p>
	</footer>
</div>
