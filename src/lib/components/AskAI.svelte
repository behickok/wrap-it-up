<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';

	let {
		sectionName
	} = $props();

	let question = $state('');
	let answer = $state('');
	let loading = $state(false);
	let open = $state(false);

	async function askAI() {
		if (!question.trim()) return;

		loading = true;
		answer = '';

		try {
			const response = await fetch('/api/ask-ai', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					section: sectionName,
					question
				})
			});

			const data = await response.json();

			if (data.success) {
				answer = data.answer;
			} else {
				answer = 'Sorry, I encountered an error. Please try again.';
			}
		} catch (error) {
			answer = 'Sorry, I encountered an error. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<Dialog bind:open>
	<DialogTrigger>
		<Button class="inline-flex items-center gap-2">
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10"></circle>
				<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
				<line x1="12" y1="17" x2="12.01" y2="17"></line>
			</svg>
			Ask AI for Help
		</Button>
	</DialogTrigger>
	<DialogContent class="sm:max-w-[600px]">
		<DialogHeader>
			<DialogTitle>Ask AI for Help</DialogTitle>
			<DialogDescription>
				Need help filling out the {sectionName} section? Ask me anything!
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4">
			<Textarea
				bind:value={question}
				placeholder="Example: What kind of information should I include about my pets?"
				rows={4}
			/>

			<Button
				class="w-full"
				onclick={askAI}
				disabled={loading || !question.trim()}
			>
				{#if loading}
					Getting answer...
				{:else}
					Get Answer
				{/if}
			</Button>

			{#if answer}
				<div class="rounded-lg border-l-4 border-primary bg-muted p-4">
					<h4 class="mb-2 font-semibold">AI Response:</h4>
					<p class="text-sm text-muted-foreground whitespace-pre-wrap">{answer}</p>
				</div>
			{/if}
		</div>
	</DialogContent>
</Dialog>
