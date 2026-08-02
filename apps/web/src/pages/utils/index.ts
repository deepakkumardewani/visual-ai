import type { GroupedObject, IImageObject } from '@/types';

export enum FeatureType {
  IMAGE = 'image',
  UPSCALE = 'upscale',
  COLORIZE = 'colorize',
  REVIVE = 'revive',
  REMOVE_BG = 'remove_bg',
}

export const FeatureIconMap = {
  image: '$imageFrame',
  upscale: '$expand',
  colorize: '$dropper',
  revive: '$camera',
  remove_bg: '$layers',
};

/** Calendar-day key (YYYY-MM-DD) for stable grouping across locales. */
function getDateKey(item: IImageObject): string {
  if (!item.createdAt) return 'Unknown';
  const date = new Date(item.createdAt);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  // Local calendar day — avoids UTC midnight shifting the label.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** e.g. "Sunday, 23 April 2023" */
function formatFullDate(dateKey: string): string {
  if (dateKey === 'Unknown') return dateKey;
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function groupByDate(data: IImageObject[]): GroupedObject[] {
  const grouped: { [key: string]: IImageObject[] } = {};

  data
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .forEach((item) => {
      const key = getDateKey(item);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

  return Object.keys(grouped).map((key) => ({
    title: formatFullDate(key),
    data: grouped[key],
    isDeleting: false,
  }));
}
