import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import { useLocal } from '@/composables/local';

function setupLocal() {
  let result: ReturnType<typeof useLocal>;
  mount({
    setup() {
      result = useLocal();
      return {};
    },
    template: '<div />',
  });
  return result!;
}

describe('useLocal', () => {
  it('stores and reads JSON values', () => {
    const { setLocal, getLocal } = setupLocal();

    setLocal('theme', { dark: true });
    expect(getLocal('theme')).toEqual({ dark: true });

    setLocal('flag', true);
    expect(getLocal('flag')).toBe(true);
  });

  it('returns undefined for missing keys', () => {
    const { getLocal } = setupLocal();
    expect(getLocal('missing-key')).toBeUndefined();
  });

  it('removes stored keys', () => {
    const { setLocal, getLocal, removeLocal } = setupLocal();
    setLocal('prompt', 'a neon city');
    removeLocal('prompt');
    expect(getLocal('prompt')).toBeUndefined();
  });
});
