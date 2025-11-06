<script lang="ts">
	import { goto } from '$app/navigation';

	let emailOrUsername = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleLogin() {
		error = '';

		if (!emailOrUsername || !password) {
			error = 'Please fill in all fields';
			return;
		}

		loading = true;

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ emailOrUsername, password })
			});

			const data = await response.json();

			if (data.success) {
				// Redirect to dashboard
				goto('/');
			} else {
				error = data.error || 'Login failed';
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
			console.error('Login error:', err);
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleLogin();
		}
	}
</script>

<div class="min-h-[calc(100vh-200px)] flex items-center justify-center p-8">
	<div class="card w-full max-w-md shadow-xl" style="background-color: var(--color-card);">
		<div class="card-body">
			<h2 class="card-title text-3xl font-bold justify-center" style="color: var(--color-foreground);">Welcome Back</h2>
			<p class="text-center" style="color: var(--color-muted-foreground);">Sign in to continue your end-of-life planning journey</p>

			{#if error}
				<div class="alert alert-error mb-4">
					<span>{error}</span>
				</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
				<div class="form-control">
					<label class="label" for="emailOrUsername">
						<span class="label-text">Email or Username</span>
					</label>
					<input
						id="emailOrUsername"
						type="text"
						bind:value={emailOrUsername}
						placeholder="Enter your email or username"
						disabled={loading}
						onkeydown={handleKeydown}
						class="input input-bordered w-full"
					/>
				</div>

				<div class="form-control">
					<label class="label" for="password">
						<span class="label-text">Password</span>
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder="Enter your password"
						disabled={loading}
						onkeydown={handleKeydown}
						class="input input-bordered w-full"
					/>
				</div>

				<button type="submit" class="btn w-full" style="background-color: var(--color-primary); color: var(--color-primary-foreground);" disabled={loading}>
					{loading ? 'Signing in...' : 'Sign In'}
				</button>
			</form>

			<div class="mt-6 text-center text-sm" style="color: var(--color-muted-foreground);">
				<p>Don't have an account? <a href="/register" class="font-semibold hover:underline" style="color: var(--color-primary);">Create one</a></p>
			</div>
		</div>
	</div>
</div>
