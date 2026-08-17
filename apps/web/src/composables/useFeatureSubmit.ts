import { onBeforeUnmount, onMounted } from 'vue';

export interface FeatureSubmitRegistration {
  canSubmit: () => boolean;
  submit: () => void | Promise<void>;
}

const registry = new Map<string, FeatureSubmitRegistration>();
const mountCounts = new Map<string, number>();

/**
 * Register the active feature's Generate/submit action for global shortcuts.
 * Supports multiple mounts of the same feature (e.g. duplicate CTAs) via ref-count.
 */
export function useFeatureSubmit(featureId: string, registration: FeatureSubmitRegistration) {
  onMounted(() => {
    registry.set(featureId, registration);
    mountCounts.set(featureId, (mountCounts.get(featureId) ?? 0) + 1);
  });

  onBeforeUnmount(() => {
    const next = (mountCounts.get(featureId) ?? 1) - 1;
    if (next <= 0) {
      mountCounts.delete(featureId);
      registry.delete(featureId);
      return;
    }
    mountCounts.set(featureId, next);
  });
}

export function trySubmitFeature(featureId: string): boolean {
  const entry = registry.get(featureId);
  if (!entry?.canSubmit()) return false;
  void entry.submit();
  return true;
}
