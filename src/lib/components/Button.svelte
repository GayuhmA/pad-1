<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    size?: 'S' | 'M' | 'L';
    variant?: 'solid' | 'line' | 'ghost';
    color?: 'primary' | 'yellow' | 'neutral';
    icon?: Snippet;
    children?: Snippet;
  }

  let { 
    size = 'M', 
    variant = 'solid',
    color = 'primary',
    icon,
    children, 
    class: className = '', 
    disabled, 
    type = 'button',
    ...rest 
  }: Props = $props();

  const baseStyles = 'inline-flex items-center justify-center font-outfit transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:shadow-none';
  
  const colorStyles = {
    solid: {
      primary: 'bg-primary-600 text-white enabled:hover:bg-primary-600 enabled:hover:shadow-[inset_0px_6px_10px_rgba(0,0,0,0.4)] enabled:active:bg-primary-700 enabled:active:shadow-none disabled:bg-neutral-300 disabled:text-neutral-50 disabled:border-transparent',
      yellow: 'bg-secondary-500 text-white enabled:hover:bg-secondary-500 enabled:hover:shadow-[inset_0px_6px_10px_rgba(0,0,0,0.4)] enabled:active:bg-secondary-600 enabled:active:shadow-none disabled:bg-neutral-300 disabled:text-neutral-50 disabled:border-transparent',
      neutral: 'bg-neutral-600 text-white enabled:hover:bg-neutral-600 enabled:hover:shadow-[inset_0px_6px_10px_rgba(0,0,0,0.4)] enabled:active:bg-neutral-700 enabled:active:shadow-none disabled:bg-neutral-300 disabled:text-neutral-50 disabled:border-transparent',
    },
    line: {
      primary: 'border-2 border-primary-600 text-primary-600 bg-transparent enabled:hover:border-transparent enabled:hover:bg-[#A9AEBC40] enabled:active:border-primary-600 enabled:active:bg-transparent enabled:active:text-primary-600 disabled:bg-transparent disabled:text-neutral-300 disabled:border-neutral-300',
      yellow: 'border-2 border-secondary-500 text-secondary-500 bg-transparent enabled:hover:border-transparent enabled:hover:bg-[#A9AEBC40] enabled:active:border-secondary-500 enabled:active:bg-transparent enabled:active:text-secondary-500 disabled:bg-transparent disabled:text-neutral-300 disabled:border-neutral-300',
      neutral: 'border-2 border-neutral-600 text-neutral-600 bg-transparent enabled:hover:border-transparent enabled:hover:bg-[#A9AEBC40] enabled:active:border-neutral-600 enabled:active:bg-transparent enabled:active:text-neutral-600 disabled:bg-transparent disabled:text-neutral-300 disabled:border-neutral-300',
    },
    ghost: {
      primary: 'bg-transparent text-primary-600 enabled:hover:bg-[#A9AEBC40] enabled:active:bg-transparent enabled:active:text-primary-600 disabled:bg-transparent disabled:text-neutral-300',
      yellow: 'bg-transparent text-secondary-500 enabled:hover:bg-[#A9AEBC40] enabled:active:bg-transparent enabled:active:text-secondary-500 disabled:bg-transparent disabled:text-neutral-300',
      neutral: 'bg-transparent text-neutral-600 enabled:hover:bg-[#A9AEBC40] enabled:active:bg-transparent enabled:active:text-neutral-600 disabled:bg-transparent disabled:text-neutral-300',
    }
  };

  const sizeStyles = {
    solid: {
      S: 'min-w-[80px] h-[32px] rounded-md gap-[10px] py-[8px] px-[12px] text-body-3',
      M: 'min-w-[96px] h-[40px] rounded-[8px] gap-[10px] py-[10px] px-[16px] text-body-2',
      L: 'min-w-[112px] h-[48px] rounded-[10px] gap-[10px] py-[12px] px-[20px] text-body-1',
    },
    line: {
      S: 'min-w-[80px] h-[36px] rounded-md gap-[10px] py-[8px] px-[12px] text-body-3',
      M: 'min-w-[96px] h-[44px] rounded-[8px] gap-[10px] py-[10px] px-[16px] text-body-2',
      L: 'min-w-[112px] h-[52px] rounded-[10px] gap-[10px] py-[12px] px-[20px] text-body-1',
    },
    ghost: {
      S: 'min-w-[80px] h-[32px] rounded-md gap-[10px] py-[8px] px-[12px] text-body-3',
      M: 'min-w-[96px] h-[40px] rounded-[8px] gap-[10px] py-[10px] px-[16px] text-body-2',
      L: 'min-w-[112px] h-[48px] rounded-[10px] gap-[10px] py-[12px] px-[20px] text-body-1',
    }
  };
</script>

<button
  {type}
  class="{baseStyles} {colorStyles[variant][color]} {sizeStyles[variant][size]} {className}"
  {disabled}
  {...rest}
>
  {#if icon}
    {@render icon()}
  {/if}
  {@render children?.()}
</button>
