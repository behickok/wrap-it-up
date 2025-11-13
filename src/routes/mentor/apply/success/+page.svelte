<script lang="ts">
</script>

<svelte:head>
	<title>Application Submitted - Wrap It Up</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-2xl">
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body text-center">
			<!-- Success Icon -->
			<div class="text-6xl mb-4">✅</div>

			<h1 class="card-title text-3xl justify-center mb-4">Application Submitted!</h1>

			<p class="text-lg text-base-content/70 mb-6">
				Thank you for applying to become a mentor. Your application has been received and will be
				reviewed by our team.
			</p>

			<!-- Timeline -->
			<div class="text-left max-w-md mx-auto mb-8">
				<h2 class="font-bold mb-4">What happens next:</h2>
				<ul class="timeline timeline-vertical timeline-compact">
					<li>
						<div class="timeline-start">Now</div>
						<div class="timeline-middle">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="w-5 h-5 text-primary"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="timeline-end timeline-box">Application Received</div>
						<hr class="bg-primary" />
					</li>
					<li>
						<hr class="bg-primary" />
						<div class="timeline-start">3-5 Days</div>
						<div class="timeline-middle">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="w-5 h-5"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="timeline-end timeline-box">Team Review</div>
						<hr />
					</li>
					<li>
						<hr />
						<div class="timeline-start">Decision</div>
						<div class="timeline-middle">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="w-5 h-5"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="timeline-end timeline-box">Email Notification</div>
						<hr />
					</li>
					<li>
						<hr />
						<div class="timeline-start">If Approved</div>
						<div class="timeline-middle">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="w-5 h-5"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="timeline-end timeline-box">Profile Created</div>
					</li>
				</ul>
			</div>

			<!-- Actions -->
			<div class="card-actions justify-center flex-col sm:flex-row gap-3">
				<a href="/" class="btn btn-outline">Return Home</a>
				<a href="/mentor/apply" class="btn btn-ghost">View Application Status</a>
			</div>

			<!-- Contact Info -->
			<div class="mt-8 p-4 bg-base-200 rounded-lg">
				<p class="text-sm text-base-content/70">
					<strong>Questions?</strong> Contact us at
					<a href="mailto:mentors@wrapitup.com" class="link">mentors@wrapitup.com</a>
				</p>
			</div>
		</div>
	</div>
</div>
