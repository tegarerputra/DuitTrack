<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';

  let portalContainer: HTMLDivElement | null = null;
  let contentWrapper: HTMLDivElement | null = null;

  onMount(async () => {
    // Create portal container at body level
    portalContainer = document.createElement('div');
    portalContainer.className = 'portal-container';
    portalContainer.style.position = 'fixed';
    portalContainer.style.top = '0';
    portalContainer.style.left = '0';
    portalContainer.style.zIndex = '999999';
    portalContainer.style.pointerEvents = 'none'; // Allow clicks through container
    document.body.appendChild(portalContainer);

    await tick();
  });

  onDestroy(() => {
    if (portalContainer && document.body.contains(portalContainer)) {
      document.body.removeChild(portalContainer);
    }
    portalContainer = null;
    contentWrapper = null;
  });

  // Move content to portal when contentWrapper is bound
  $: if (contentWrapper && portalContainer) {
    portalContainer.appendChild(contentWrapper);
  }
</script>

{#if portalContainer}
  <div bind:this={contentWrapper} style="pointer-events: auto;">
    <slot />
  </div>
{/if}
