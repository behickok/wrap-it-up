<script lang="ts">

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

<button class="btn inline-flex items-center gap-2" style="background-color: var(--color-primary); color: var(--color-primary-foreground);" onclick={() => open = true}>
	<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<circle cx="12" cy="12" r="10"></circle>
		<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
		<line x1="12" y1="17" x2="12.01" y2="17"></line>
	</svg>
	Ask AI for Help
</button>

<dialog class="modal" class:modal-open={open}>
	<div class="modal-box max-w-[600px]">
		<h3 class="font-bold text-lg">Ask AI for Help</h3>
		<p class="py-2" style="color: var(--color-muted-foreground);">
			Need help filling out the {sectionName} section? Ask me anything!
		</p>

		<div class="space-y-4 mt-4">
			<textarea
				bind:value={question}
				placeholder="Example: What kind of information should I include about my pets?"
				rows={4}
				class="textarea textarea-bordered w-full"
			></textarea>

			<button
				class="btn w-full"
				style="background-color: var(--color-primary); color: var(--color-primary-foreground);"
				onclick={askAI}
				disabled={loading || !question.trim()}
			>
				{#if loading}
					Getting answer...
				{:else}
					Get Answer
				{/if}
			</button>

			{#if answer}
				<div class="rounded-lg border-l-4 p-4" style="background-color: var(--color-muted); border-color: var(--color-primary);">
					<h4 class="mb-2 font-semibold">AI Response:</h4>
					<p class="text-sm whitespace-pre-wrap" style="color: var(--color-muted-foreground);">{answer}</p>
				</div>
			{/if}
		</div>

		<div class="modal-action">
			<button class="btn btn-outline" onclick={() => open = false}>Close</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => open = false}>close</button>
	</form>
</dialog>
