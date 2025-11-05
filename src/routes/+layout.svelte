<script>
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

<div class="app">
	<header>
		<div class="header-container">
			{#if $page.data?.user}
				<div class="readiness-score">
					<div class="score-circle">
						<span class="score-value">{$page.data?.readinessScore?.total_score || 0}%</span>
						<span class="score-label">Ready</span>
					</div>
				</div>
			{:else}
				<div></div>
			{/if}

			<div class="header-title">
				<h1>Wrap It Up</h1>
				<p class="subtitle">Your End of Life Planning Workbook</p>
			</div>

			{#if $page.data?.user}
				<div class="user-section">
					<span class="username">@{$page.data.user.username}</span>
					<button class="logout-btn" onclick={handleLogout} disabled={loggingOut}>
						{loggingOut ? 'Logging out...' : 'Logout'}
					</button>
				</div>
			{:else}
				<nav class="main-nav">
					<a href="/login" class:active={$page.url.pathname === '/login'}>Login</a>
					<a href="/register" class:active={$page.url.pathname === '/register'}>Register</a>
				</nav>
			{/if}
		</div>
	</header>

	<main>
		{@render children?.()}
	</main>

	<footer>
		<p>Wrap It Up - Organize your legacy with care</p>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: #f5f5f5;
	}

	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1rem 0;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.header-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 2rem;
	}

	.readiness-score {
		position: relative;
	}

	.score-circle {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(10px);
		border: 3px solid rgba(255, 255, 255, 0.3);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.score-value {
		font-size: 1.5rem;
		font-weight: bold;
		line-height: 1;
	}

	.score-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		opacity: 0.9;
	}

	.header-title {
		text-align: center;
	}

	.header-title h1 {
		margin: 0;
		font-size: 2rem;
		font-weight: 600;
	}

	.subtitle {
		margin: 0.25rem 0 0 0;
		font-size: 0.9rem;
		opacity: 0.9;
	}

	.main-nav {
		display: flex;
		gap: 1rem;
	}

	.main-nav a {
		color: white;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		transition: background 0.2s;
	}

	.main-nav a:hover,
	.main-nav a.active {
		background: rgba(255, 255, 255, 0.2);
	}

	.user-section {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.username {
		font-weight: 600;
		font-size: 0.95rem;
		opacity: 0.95;
	}

	.logout-btn {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s;
	}

	.logout-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-1px);
	}

	.logout-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	main {
		flex: 1;
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		width: 100%;
		box-sizing: border-box;
	}

	footer {
		background: #2d3748;
		color: white;
		text-align: center;
		padding: 1.5rem;
		margin-top: auto;
	}

	footer p {
		margin: 0;
		opacity: 0.8;
	}

	@media (max-width: 768px) {
		.header-container {
			grid-template-columns: 1fr;
			text-align: center;
			gap: 1rem;
		}

		.score-circle {
			margin: 0 auto;
		}

		.main-nav {
			justify-content: center;
		}
	}
</style>
