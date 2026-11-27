'use client';

import { useState } from 'react';
import Image from 'next/image';
import { DEFAULT_LOGO_SRC, useActiveLogo } from '@/hooks/use-active-logo';

interface BrandLogoProps {
  width: number;
  height: number;
  className?: string;
  alt?: string;
  priority?: boolean;
}

export function BrandLogo({
  width,
  height,
  className,
  alt,
  priority = false,
}: BrandLogoProps) {
  const { logoUrl, logoAlt } = useActiveLogo();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const src = logoUrl && logoUrl !== failedUrl ? logoUrl : DEFAULT_LOGO_SRC;
  const isRemote = src !== DEFAULT_LOGO_SRC;

  return (
    <Image
      src={src}
      alt={alt ?? logoAlt}
      width={width}
      height={height}
      unoptimized={isRemote}
      priority={priority}
      className={className}
      onError={() => {
        if (isRemote) setFailedUrl(src);
      }}
    />
  );
}

