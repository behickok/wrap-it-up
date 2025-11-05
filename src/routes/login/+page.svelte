<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

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

<div class="min-h-[calc(100vh-200px)] flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-200">
	<Card class="w-full max-w-md">
		<CardHeader class="text-center">
			<CardTitle class="text-3xl font-bold">Welcome Back</CardTitle>
			<CardDescription>Sign in to continue your end-of-life planning journey</CardDescription>
		</CardHeader>
		<CardContent>
			{#if error}
				<div class="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6 text-sm">
					{error}
				</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
				<div class="space-y-2">
					<Label for="emailOrUsername">Email or Username</Label>
					<Input
						id="emailOrUsername"
						type="text"
						bind:value={emailOrUsername}
						placeholder="Enter your email or username"
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
						placeholder="Enter your password"
						disabled={loading}
						onkeydown={handleKeydown}
					/>
				</div>

				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Signing in...' : 'Sign In'}
				</Button>
			</form>

			<div class="mt-6 text-center text-sm text-muted-foreground">
				<p>Don't have an account? <a href="/register" class="text-primary font-semibold hover:underline">Create one</a></p>
			</div>
		</CardContent>
	</Card>
</div>
