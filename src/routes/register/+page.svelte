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

<div class="auth-container">
	<div class="auth-card">
		<h1>Create Account</h1>
		<p class="subtitle">Start your compassionate end-of-life planning journey</p>

		{#if error}
			<div class="error-message">
				{error}
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleRegister(); }}>
			<div class="form-group">
				<label for="email">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					placeholder="Enter your email"
					disabled={loading}
					onkeydown={handleKeydown}
				/>
			</div>

			<div class="form-group">
				<label for="username">Username</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					placeholder="Choose a username (3-20 characters)"
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
					placeholder="Create a strong password"
					disabled={loading}
					onkeydown={handleKeydown}
				/>
				<small class="helper-text">
					Must be 8+ characters with uppercase, lowercase, and number
				</small>
			</div>

			<div class="form-group">
				<label for="confirmPassword">Confirm Password</label>
				<input
					id="confirmPassword"
					type="password"
					bind:value={confirmPassword}
					placeholder="Confirm your password"
					disabled={loading}
					onkeydown={handleKeydown}
				/>
			</div>

			<button type="submit" class="btn-primary" disabled={loading}>
				{loading ? 'Creating Account...' : 'Create Account'}
			</button>
		</form>

		<div class="auth-footer">
			<p>Already have an account? <a href="/login">Sign in</a></p>
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

	.helper-text {
		display: block;
		margin-top: 0.25rem;
		color: #718096;
		font-size: 0.75rem;
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
