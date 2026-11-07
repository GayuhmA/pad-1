interface AvatarProps {
  name: string;
  className?: string;
}

export function Avatar({ name, className = '' }: AvatarProps) {
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('id');
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center rounded-full bg-neutral-100 font-bold text-neutral-600 ${className}`}>
      {initials || '?'}
    </span>
  );
}
