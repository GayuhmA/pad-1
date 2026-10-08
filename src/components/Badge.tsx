import { type HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'solid' | 'soft';
  color?: 'primary' | 'secondary' | 'neutral' | 'success';
}

export function Badge({
  variant = 'soft',
  color = 'primary',
  children,
  className = '',
  ...rest
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center justify-center font-outfit font-semibold px-5 py-0.5 rounded-2xl w-fit text-body-3';

  const colorStyles = {
    solid: {
      primary: 'bg-primary-500 text-white',
      secondary: 'bg-secondary-500 text-white',
      neutral: 'bg-neutral-500 text-white',
      success: 'bg-[#04C065] text-white',
    },
    soft: {
      primary: 'bg-primary-100 text-primary-500',
      secondary: 'bg-secondary-100 text-secondary-500',
      neutral: 'bg-neutral-100 text-neutral-600',
      success: 'bg-green-100 text-green-700',
    }
  };

  return (
    <span
      className={`${baseStyles} ${colorStyles[variant][color]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
