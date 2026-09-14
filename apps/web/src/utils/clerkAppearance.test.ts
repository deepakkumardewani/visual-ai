import { describe, expect, it } from 'vitest';

import { clerkAppearance } from '@/utils/clerkAppearance';

describe('clerkAppearance', () => {
  it('uses Visual AI gold and dark atelier variables', () => {
    expect(clerkAppearance.variables?.colorPrimary).toBe('#C9A84C');
    expect(clerkAppearance.variables?.colorBackground).toBe('#0F0C09');
    expect(clerkAppearance.variables?.colorDanger).toBe('#DC2626');
    expect(clerkAppearance.variables?.borderRadius).toBe('0.5rem');
    expect(clerkAppearance.variables?.fontFamily).toContain('Source Sans 3');
  });

  it('themes the card and primary button for the dark gallery', () => {
    const elements = clerkAppearance.elements as Record<string, Record<string, string>>;

    expect(elements.card.background).toBe('rgb(15 12 9)');
    expect(elements.card.boxShadow).toBe('none');
    expect(elements.rootBox.maxWidth).toBe('420px');
    expect(elements.formButtonPrimary.color).toBe('#0D0A07');
    expect(elements.formButtonPrimary.background).toContain('#C9A84C');
  });

  it('keeps secondary text and action links in the copper family', () => {
    const elements = clerkAppearance.elements as Record<string, Record<string, string>>;

    expect(elements.headerSubtitle.color).toBe('#AC9C8C');
    expect(elements.footerActionLink.color).toBe('#C98A5A');
    expect(elements.identityPreviewEditButton.color).toBe('#C98A5A');
    expect(elements.formFieldAction.color).toBe('#C98A5A');
  });
});
