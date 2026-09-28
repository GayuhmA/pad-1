<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/Button.svelte';
  import logo from '$lib/assets/images/logo.png';
  import notificationIcon from '$lib/assets/icons/notification.svg';

  const navItems = [
    { name: 'Beranda', href: '/' },
    { name: 'Lomba', href: '/lomba' },
    { name: 'Pendaftaran', href: '/pendaftaran' },
    { name: 'Iuran', href: '/iuran' },
    { name: 'Histori', href: '/histori' },
  ];
</script>

<header class="w-full bg-white flex justify-center sticky top-0 z-50">
  <nav class="w-full max-w-360 h-28 px-5 md:px-15 flex items-center">

    <div class="flex-1 flex justify-start items-center">
      <a href="/" class="block">
        <img src={logo} alt="Logo" class="h-20 w-auto object-contain" />
      </a>
    </div>

                <div class="hidden lg:flex w-175 h-18 bg-neutral-100 rounded-[10px] items-center justify-between px-3 shrink-0">
      {#each navItems as item}
        {@const isActive = $page.url.pathname === item.href}
        {#if isActive}
          <Button 
            variant="ghost" 
            color="primary" 
            size="L"
            onclick={() => goto(item.href)}
            class="bg-primary-100! text-primary-600! relative overflow-hidden"
          >
            <span class="text-h7! font-bold invisible" aria-hidden="true">{item.name}</span>
            <span class="absolute inset-0 flex items-center justify-center text-h7! font-bold">{item.name}</span>
          </Button>
        {:else}
          <Button 
            variant="ghost" 
            color="primary" 
            size="L"
            onclick={() => goto(item.href)}
            class="text-primary-600! hover:bg-primary-10! relative overflow-hidden"
          >
            <span class="text-h7! font-bold invisible" aria-hidden="true">{item.name}</span>
            <span class="absolute inset-0 flex items-center justify-center text-body-1! font-bold transition-all">{item.name}</span>
          </Button>
        {/if}
      {/each}
    </div>

    <div class="flex-1 flex justify-end items-center gap-6">
      <button class="relative hover:bg-neutral-100 p-2 rounded-full transition-colors flex items-center justify-center">
        <img src={notificationIcon} alt="Notification" class="w-7 h-7" />
        <!-- <span class="absolute top-2 right-2 w-2.5 h-2.5 bg-primary-600 rounded-full border-2 border-white"></span> -->
      </button>
      <button class="w-12 h-12 rounded-full border border-neutral-200 overflow-hidden bg-white flex items-center justify-center shrink-0">
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=F1F1F4" alt="Profile" class="w-full h-full object-cover" />
      </button>
      
      <button class="lg:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg" aria-label="Buka Menu">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="4" x2="20" y1="12" y2="12"/>
          <line x1="4" x2="20" y1="6" y2="6"/>
          <line x1="4" x2="20" y1="18" y2="18"/>
        </svg>
      </button>
    </div>

  </nav>
</header>
