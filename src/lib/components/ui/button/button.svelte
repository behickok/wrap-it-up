<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { Button as ButtonPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { buttonVariants, type Variant, type Size } from './index';

	type $$Props = ButtonPrimitive.Props & {
		variant?: Variant;
		size?: Size;
	};

	let className: $$Props['class'] = undefined;
	export { className as class };
	export let variant: $$Props['variant'] = 'default';
	export let size: $$Props['size'] = 'default';
	export let builders: $$Props['builders'] = [];
</script>

<ButtonPrimitive.Root
	{builders}
	class={cn(buttonVariants({ variant, size, className }))}
	type="button"
	{...$$restProps}
	on:click
	on:keydown
>
	<slot />
</ButtonPrimitive.Root>
