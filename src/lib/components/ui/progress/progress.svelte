<script lang="ts">
	import { Progress as ProgressPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	type $$Props = ProgressPrimitive.Props;

	let className: $$Props['class'] = undefined;
	export let value: $$Props['value'] = 0;
	export { className as class };
</script>

<ProgressPrimitive.Root
	{value}
	class={cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className)}
	{...$$restProps}
>
	<div
		class="h-full w-full flex-1 bg-primary transition-all"
		style={`transform: translateX(-${100 - (value || 0)}%)`}
	></div>
</ProgressPrimitive.Root>
