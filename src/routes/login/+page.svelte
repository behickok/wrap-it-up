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

<div class="auth-container">
	<div class="auth-card">
		<h1>Welcome Back</h1>
		<p class="subtitle">Sign in to continue your end-of-life planning journey</p>

		{#if error}
			<div class="error-message">
				{error}
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }}>
			<div class="form-group">
				<label for="emailOrUsername">Email or Username</label>
				<input
					id="emailOrUsername"
					type="text"
					bind:value={emailOrUsername}
					placeholder="Enter your email or username"
					disabled={loading}
					onkeydown={handleKeydown}
				/>
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="Enter your password"
					disabled={loading}
					onkeydown={handleKeydown}
				/>
			</div>

			<button type="submit" class="btn-primary" disabled={loading}>
				{loading ? 'Signing in...' : 'Sign In'}
			</button>
		</form>

		<div class="auth-footer">
			<p>Don't have an account? <a href="/register">Create one</a></p>
		</div>
	</div>
</div>

<style>
	.auth-container {
		min-height: calc(100vh - 200px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	}

	.auth-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		padding: 3rem;
		width: 100%;
		max-width: 450px;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #2d3748;
		margin-bottom: 0.5rem;
		text-align: center;
	}

	.subtitle {
		color: #718096;
		text-align: center;
		margin-bottom: 2rem;
	}

	.error-message {
		background-color: #fed7d7;
		color: #c53030;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		font-weight: 600;
		color: #2d3748;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	input:focus {
		outline: none;
		border-color: #7c3aed;
	}

	input:disabled {
		background-color: #f7fafc;
		cursor: not-allowed;
	}

	.btn-primary {
		width: 100%;
		padding: 0.875rem;
		background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.auth-footer {
		margin-top: 2rem;
		text-align: center;
		color: #718096;
		font-size: 0.875rem;
	}

	.auth-footer a {
		color: #7c3aed;
		text-decoration: none;
		font-weight: 600;
	}

	.auth-footer a:hover {
		text-decoration: underline;
	}
</style>
