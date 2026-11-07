export interface AlbumPhoto {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  filename: string;
}

// Temporary photo fixtures. Replace with documentation assets when available.
const PLACEHOLDER_DIMENSIONS = [
  [345, 260], [224, 224], [345, 254], [224, 298],
  [345, 345], [224, 149], [345, 310], [224, 126],
  [345, 194], [224, 224], [345, 225], [224, 204],
  [224, 168], [224, 149],
] as const;

export function getAlbumPhotos(slug: string, title: string): AlbumPhoto[] {
  return PLACEHOLDER_DIMENSIONS.map(([width, height], index) => ({
    id: `${slug}-${index + 1}`,
    src: '/images/album-placeholder.svg',
    alt: `Placeholder foto ${index + 1} — ${title}`,
    width,
    height,
    filename: `${slug}-placeholder-${index + 1}.svg`,
  }));
}
