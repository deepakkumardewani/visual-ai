import { describe, expect, it } from 'vitest';

import { FeatureIconMap, FeatureType, groupByDate } from './index';
import type { IImageObject } from '@/types';

function image(partial: Partial<IImageObject> & Pick<IImageObject, 'id'>): IImageObject {
  return {
    prompt: '',
    featureType: FeatureType.IMAGE,
    ...partial,
  } as IImageObject;
}

describe('pages/utils', () => {
  it('exposes feature types and icon map keys', () => {
    expect(FeatureType.IMAGE).toBe('image');
    expect(FeatureIconMap.upscale).toBe('$expand');
    expect(Object.keys(FeatureIconMap)).toEqual(Object.values(FeatureType));
  });

  it('groups images by local calendar day and sorts newest first', () => {
    const newer = image({ id: '2', createdAt: '2024-04-23T18:00:00' });
    const older = image({ id: '1', createdAt: '2024-04-22T10:00:00' });
    const sameDay = image({ id: '3', createdAt: '2024-04-23T08:00:00' });

    const groups = groupByDate([older, newer, sameDay]);

    expect(groups).toHaveLength(2);
    expect(groups[0].title).toContain('23 April 2024');
    expect(groups[0].data.map((item) => item.id)).toEqual(['2', '3']);
    expect(groups[0].isDeleting).toBe(false);
    expect(groups[1].title).toContain('22 April 2024');
  });

  it('uses Unknown when createdAt is missing or invalid', () => {
    const groups = groupByDate([image({ id: 'a' }), image({ id: 'b', createdAt: 'not-a-date' })]);

    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe('Unknown');
    expect(groups[0].data).toHaveLength(2);
  });
});
