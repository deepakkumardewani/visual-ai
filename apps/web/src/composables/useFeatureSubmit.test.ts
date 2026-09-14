import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { trySubmitFeature, useFeatureSubmit } from '@/composables/useFeatureSubmit';

function mountSubmit(
  featureId: string,
  registration: { canSubmit: () => boolean; submit: () => void },
) {
  return mount({
    setup() {
      useFeatureSubmit(featureId, registration);
      return {};
    },
    template: '<div />',
  });
}

describe('useFeatureSubmit', () => {
  it('returns false when the feature is not registered', () => {
    expect(trySubmitFeature('missing-feature')).toBe(false);
  });

  it('submits when canSubmit is true', () => {
    const submit = vi.fn();
    const wrapper = mountSubmit('image', { canSubmit: () => true, submit });

    expect(trySubmitFeature('image')).toBe(true);
    expect(submit).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('does not submit when canSubmit is false', () => {
    const submit = vi.fn();
    const wrapper = mountSubmit('image', { canSubmit: () => false, submit });

    expect(trySubmitFeature('image')).toBe(false);
    expect(submit).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('keeps the registry until the last mount unregisters', () => {
    const first = vi.fn();
    const second = vi.fn();
    const a = mountSubmit('upscale', { canSubmit: () => true, submit: first });
    const b = mountSubmit('upscale', { canSubmit: () => true, submit: second });

    expect(trySubmitFeature('upscale')).toBe(true);
    expect(second).toHaveBeenCalledTimes(1);

    a.unmount();
    expect(trySubmitFeature('upscale')).toBe(true);
    expect(second).toHaveBeenCalledTimes(2);

    b.unmount();
    expect(trySubmitFeature('upscale')).toBe(false);
  });
});
