<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	type $$Props = SelectPrimitive.TriggerProps;

	let className: $$Props['class'] = undefined;
	export { className as class };
</script>

<SelectPrimitive.Trigger {...$$restProps}>
	{#snippet child({ props })}
		{@const { class: propsClass, ...restProps } = props}
		<button
			{...restProps}
			class={cn(
				'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
				propsClass,
				className
			)}
		>
			<span class="truncate">
				<slot />
			</span>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="ml-2 h-4 w-4 opacity-50"
			>
				<path d="m6 9 6 6 6-6" />
			</svg>
		</button>
	{/snippet}
</SelectPrimitive.Trigger>
