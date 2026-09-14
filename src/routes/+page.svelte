<script lang="ts">
  import Button from '$lib/components/Button.svelte';
</script>

<div class="p-8 flex flex-col gap-8">
  <div class="flex flex-col gap-4">
    <h1 class="text-h1 font-outfit text-primary-500">Welcome to SvelteKit</h1>
    <p class="text-body-1 text-neutral-500">Lorem ipsum dolor sit amet consectetur adipisicing elit. Ratione ipsum harum officia, facilis veritatis molestiae? Fugiat quidem vero, nam quo inventore fuga autem repellendus sequi earum animi repellat laboriosam ad.</p>
  </div>

  <div class="flex flex-col gap-4">
    <div class="flex items-end gap-4">
      <Button size="S" variant="solid" color="primary">Small</Button>
      <Button size="M" variant="solid" color="primary">Medium</Button>
      <Button size="L" variant="solid" color="primary">Large</Button>
    </div>

    <div class="flex items-end gap-4">
      <Button size="M" variant="line" color="primary">Primary Line</Button>
      <Button size="M" variant="line" color="yellow">Yellow Line</Button>
      <Button size="M" variant="line" color="neutral">Neutral Line</Button>
    </div>

    <div class="flex items-end gap-4">
      <Button size="M" variant="ghost" color="primary">Primary Ghost</Button>
      <Button size="M" variant="ghost" color="yellow">Yellow Ghost</Button>
      <Button size="M" variant="ghost" color="neutral">Neutral Ghost</Button>
    </div>

    <div class="flex items-end gap-4">
      <Button size="M" variant="solid" disabled>Solid Disabled</Button>
      <Button size="M" variant="line" disabled>Line Disabled</Button>
      <Button size="M" variant="ghost" disabled>Ghost Disabled</Button>
    </div>



  </div>
</div>
