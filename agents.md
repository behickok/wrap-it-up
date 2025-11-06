# UI Select `invalid_default_snippet` Fix

- **Symptom**: Clicking the *Add Credential* button threw `invalid_default_snippet` from Svelte, complaining about `{@render children(...)}` with `let:` directives. This happened because our select trigger component forwarded Bits UI’s default children snippet while also exposing `let:builder`.
- **Root Cause**: Bits UI’s `SelectPrimitive.Trigger` uses the default `children` snippet internally. When we attach a `let:` directive (`let:builder`) to that component, Svelte forbids the component from also relying on the implicit `children` snippet, triggering the error.
- **Resolution**:
  - Stop using `let:builder` unless absolutely necessary.
  - Provide our own `child` snippet to render the trigger button so Bits UI no longer falls back to its default snippet. We now spread the merged trigger props onto a `<button>` and merge classes via `cn`, keeping existing styles and behavior intact.
- **Key Files**:
  - `src/lib/components/ui/select/select-trigger.svelte`
  - `src/lib/components/FormField.svelte`

When building future components with Bits UI (or any snippet-driven library), prefer named snippets (`{#snippet child ...}`) whenever the component also needs `let:` directives. This prevents Svelte from mixing default snippets with external `let:` bindings, which is what `invalid_default_snippet` guards against.***
