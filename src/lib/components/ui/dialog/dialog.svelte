<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';

	type $$Props = DialogPrimitive.Props;

	export let open: $$Props['open'] = undefined;
</script>

<DialogPrimitive.Root bind:open {...$$restProps}>
	<slot />
</DialogPrimitive.Root>
