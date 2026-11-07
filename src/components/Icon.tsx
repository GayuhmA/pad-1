interface IconProps {
  name: 'notification' | 'clock-circle';
  className?: string;
}

/** Reuse the SVG asset's silhouette and opacity while inheriting text color. */
export function Icon({ name, className = '' }: IconProps) {
  const source = `url('/icons/${name}.svg')`;
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] ${className}`}
      style={{ maskImage: source, WebkitMaskImage: source }}
    />
  );
}
