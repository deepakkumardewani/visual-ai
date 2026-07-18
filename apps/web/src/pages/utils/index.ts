import type { GroupedObject, IImageObject } from '@/types';

export enum FeatureType {
  IMAGE = 'image',
  UPSCALE = 'upscale',
  COLORIZE = 'colorize',
  REVIVE = 'revive',
}

export const FeatureIconMap = {
  image: '$imageFrame',
  upscale: '$expand',
  colorize: '$dropper',
  revive: '$camera',
};

export function groupByDate(data: IImageObject[]): GroupedObject[] {
  const grouped: { [key: string]: IImageObject[] } = {};
  // Group objects by humanReadableDate in descending order
  data
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .forEach((item) => {
      const date =
        item.humanReadableDate ||
        (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });

  // Convert the grouped data into the desired format
  const result: GroupedObject[] = Object.keys(grouped).map((date) => ({
    title: formatDate(date), // Formatting date to desired format like "08 Oct"
    data: grouped[date],
    isDeleting: false,
  }));

  return result;
}

function formatDate(date: string): string {
  if (date === 'Unknown') return date;

  // Assuming the input date is in "MM/DD/YYYY" format
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const [month, day] = date.split('/');

  // Convert month number to month name (zero-indexed)
  const monthName = months[parseInt(month, 10) - 1];

  return `${day} ${monthName}`;
}
