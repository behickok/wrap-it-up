<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { scale } from 'svelte/transition';

	type $$Props = SelectPrimitive.ContentProps;

	let className: $$Props['class'] = undefined;
	export { className as class };
	export let transition: $$Props['transition'] = scale;
	export let transitionConfig: $$Props['transitionConfig'] = {
		duration: 150
	};
</script>

<SelectPrimitive.Content
	{transition}
	{transitionConfig}
	class={cn(
		'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
		className
	)}
	{...$$restProps}
>
	<div class="w-full p-1">
		<slot />
	</div>
</SelectPrimitive.Content>
