<script>
	let {
		sectionName
	} = $props();

	let question = $state('');
	let answer = $state('');
	let loading = $state(false);
	let showModal = $state(false);

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

<button class="ask-ai-button" onclick={() => showModal = true}>
	<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<circle cx="12" cy="12" r="10"></circle>
		<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
		<line x1="12" y1="17" x2="12.01" y2="17"></line>
	</svg>
	Ask AI for Help
</button>

{#if showModal}
	<div class="modal-overlay" onclick={() => showModal = false}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Ask AI for Help</h3>
				<button class="close-button" onclick={() => showModal = false}>×</button>
			</div>

			<div class="modal-body">
				<p class="helper-text">
					Need help filling out the {sectionName} section? Ask me anything!
				</p>

				<textarea
					bind:value={question}
					placeholder="Example: What kind of information should I include about my pets?"
					rows="4"
				></textarea>

				<button
					class="submit-button"
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
					<div class="answer-box">
						<h4>AI Response:</h4>
						<p>{answer}</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.ask-ai-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.ask-ai-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal {
		background: white;
		border-radius: 12px;
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.modal-header h3 {
		margin: 0;
		color: #2d3748;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 2rem;
		color: #718096;
		cursor: pointer;
		line-height: 1;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.close-button:hover {
		background: #f7fafc;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.helper-text {
		color: #4a5568;
		margin-bottom: 1rem;
	}

	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #cbd5e0;
		border-radius: 6px;
		font-size: 1rem;
		font-family: inherit;
		resize: vertical;
		box-sizing: border-box;
	}

	textarea:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.submit-button {
		width: 100%;
		margin-top: 1rem;
		padding: 0.75rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.submit-button:hover:not(:disabled) {
		opacity: 0.9;
	}

	.submit-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.answer-box {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #f7fafc;
		border-radius: 6px;
		border-left: 4px solid #667eea;
	}

	.answer-box h4 {
		margin: 0 0 0.5rem 0;
		color: #2d3748;
		font-size: 1rem;
	}

	.answer-box p {
		margin: 0;
		color: #4a5568;
		line-height: 1.6;
		white-space: pre-wrap;
	}
</style>
