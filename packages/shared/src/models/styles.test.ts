import { describe, it, expect } from 'vitest';
import { STYLE_PRESETS, getStylePreset } from './styles.js';
import type { StyleId } from './styles.js';

describe('STYLE_PRESETS catalog', () => {
  it('contains at least 15 style presets', () => {
    expect(STYLE_PRESETS.length).toBeGreaterThanOrEqual(15);
  });

  it('includes None and Dynamic presets', () => {
    const ids = STYLE_PRESETS.map((p) => p.id);
    expect(ids).toContain('none');
    expect(ids).toContain('dynamic');
  });

  it('all preset ids are unique', () => {
    const ids = STYLE_PRESETS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all preset labels are non-empty', () => {
    for (const preset of STYLE_PRESETS) {
      expect(preset.label).toBeTruthy();
      expect(preset.label.length).toBeGreaterThan(0);
    }
  });

  it('None preset has empty promptSuffix', () => {
    const none = STYLE_PRESETS.find((p) => p.id === 'none');
    expect(none).toBeDefined();
    expect(none?.promptSuffix).toBe('');
  });

  it('non-None presets have non-empty promptSuffix', () => {
    for (const preset of STYLE_PRESETS) {
      if (preset.id !== 'none') {
        expect(preset.promptSuffix).toBeTruthy();
        expect(preset.promptSuffix.length).toBeGreaterThan(0);
      }
    }
  });

  // Image models read descriptor tags as scene content, so any subject-implying token
  // in a style string invents a person the user never prompted for (a landscape + the
  // Portrait style used to render a woman). Styles may only describe how, never what.
  it('no preset string contains subject-implying tokens', () => {
    const SUBJECT_TOKENS =
      /\b(skin|eyes|pose|posed|character|characters|couture|model|face|facial|portrait of)\b/i;

    for (const preset of STYLE_PRESETS) {
      expect(preset.promptSuffix).not.toMatch(SUBJECT_TOKENS);
      expect(preset.styleDescription).not.toMatch(SUBJECT_TOKENS);
    }
  });

  it('each preset has valid id, label, and promptSuffix properties', () => {
    for (const preset of STYLE_PRESETS) {
      expect(typeof preset.id).toBe('string');
      expect(typeof preset.label).toBe('string');
      expect(typeof preset.promptSuffix).toBe('string');
    }
  });
});

describe('getStylePreset function', () => {
  it('returns the correct preset for valid ids', () => {
    const none = getStylePreset('none');
    expect(none.label).toBe('None');
    expect(none.promptSuffix).toBe('');

    const dynamic = getStylePreset('dynamic');
    expect(dynamic.label).toBe('Dynamic');
    expect(dynamic.promptSuffix).toContain('dynamic');
  });

  it('throws for unknown style id', () => {
    expect(() => getStylePreset('unknown_style')).toThrow('Unknown style id');
  });

  it('throws for empty id', () => {
    expect(() => getStylePreset('')).toThrow('Unknown style id');
  });
});

describe('StyleId type derivation', () => {
  it('StyleId is correctly derived from catalog', () => {
    // This test just ensures the type compiles and works correctly
    // The actual validation happens at TypeScript compile time
    const styleIds: StyleId[] = STYLE_PRESETS.map((p) => p.id as StyleId);
    expect(styleIds).toHaveLength(STYLE_PRESETS.length);
  });
});
