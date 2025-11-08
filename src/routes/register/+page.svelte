<script lang="ts">
	import { goto } from '$app/navigation';

	let email = $state('');
	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleRegister() {
		error = '';

		// Client-side validation
		if (!email || !username || !password || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}

		if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
			error = 'Password must contain uppercase, lowercase, and number';
			return;
		}

		if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
			error = 'Username must be 3-20 characters, alphanumeric and underscores only';
			return;
		}

		loading = true;

		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, username, password })
			});

			const data = await response.json();

			if (data.success) {
				// Redirect to dashboard
				goto('/');
			} else {
				error = data.error || 'Registration failed';
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
			console.error('Registration error:', err);
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleRegister();
		}
	}
</script>

<div class="min-h-[calc(100vh-200px)] flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-200">
	<div class="card w-full max-w-md shadow-xl" style="background-color: var(--color-card);">
		<div class="card-body">
			<h2 class="card-title text-3xl font-bold justify-center" style="color: var(--color-foreground);">Create Account</h2>
			<p class="text-center" style="color: var(--color-muted-foreground);">Start your compassionate end-of-life planning journey</p>

			{#if error}
				<div class="alert alert-error mb-4">
					<span>{error}</span>
				</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); handleRegister(); }} class="space-y-4">
				<div class="form-control">
					<label class="label" for="email">
						<span class="label-text">Email</span>
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="Enter your email"
						disabled={loading}
						onkeydown={handleKeydown}
						class="input input-bordered w-full"
					/>
				</div>

				<div class="form-control">
					<label class="label" for="username">
						<span class="label-text">Username</span>
					</label>
					<input
						id="username"
						type="text"
						bind:value={username}
						placeholder="Choose a username (3-20 characters)"
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
						placeholder="Create a strong password"
						disabled={loading}
						onkeydown={handleKeydown}
						class="input input-bordered w-full"
					/>
					<p class="label-text-alt px-1 pt-1" style="color: var(--color-muted-foreground);">
						Must be 8+ characters with uppercase, lowercase, and number
					</p>
				</div>

				<div class="form-control">
					<label class="label" for="confirmPassword">
						<span class="label-text">Confirm Password</span>
					</label>
					<input
						id="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						placeholder="Confirm your password"
						disabled={loading}
						onkeydown={handleKeydown}
						class="input input-bordered w-full"
					/>
				</div>

				<button type="submit" class="btn w-full" style="background-color: var(--color-primary); color: var(--color-primary-foreground);" disabled={loading}>
					{loading ? 'Creating Account...' : 'Create Account'}
				</button>
			</form>

			<div class="mt-6 text-center text-sm" style="color: var(--color-muted-foreground);">
				<p>Already have an account? <a href="/login" class="font-semibold hover:underline" style="color: var(--color-primary);">Sign in</a></p>
			</div>
		</div>
	</div>
</div>
