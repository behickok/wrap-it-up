<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

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
	<Card class="w-full max-w-md">
		<CardHeader class="text-center">
			<CardTitle class="text-3xl font-bold">Create Account</CardTitle>
			<CardDescription>Start your compassionate end-of-life planning journey</CardDescription>
		</CardHeader>
		<CardContent>
			{#if error}
				<div class="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6 text-sm">
					{error}
				</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); handleRegister(); }} class="space-y-4">
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						type="email"
						bind:value={email}
						placeholder="Enter your email"
						disabled={loading}
						onkeydown={handleKeydown}
					/>
				</div>

				<div class="space-y-2">
					<Label for="username">Username</Label>
					<Input
						id="username"
						type="text"
						bind:value={username}
						placeholder="Choose a username (3-20 characters)"
						disabled={loading}
						onkeydown={handleKeydown}
					/>
				</div>

				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						type="password"
						bind:value={password}
						placeholder="Create a strong password"
						disabled={loading}
						onkeydown={handleKeydown}
					/>
					<p class="text-xs text-muted-foreground">
						Must be 8+ characters with uppercase, lowercase, and number
					</p>
				</div>

				<div class="space-y-2">
					<Label for="confirmPassword">Confirm Password</Label>
					<Input
						id="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						placeholder="Confirm your password"
						disabled={loading}
						onkeydown={handleKeydown}
					/>
				</div>

				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Creating Account...' : 'Create Account'}
				</Button>
			</form>

			<div class="mt-6 text-center text-sm text-muted-foreground">
				<p>Already have an account? <a href="/login" class="text-primary font-semibold hover:underline">Sign in</a></p>
			</div>
		</CardContent>
	</Card>
</div>
