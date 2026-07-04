import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('tailwind design tokens', () => {
  const configPath = resolve(process.cwd(), 'tailwind.config.js');
  const pluginPath = resolve(process.cwd(), 'tailwind.semantic-plugin.js');
  const configSource = readFileSync(configPath, 'utf8');
  const pluginSource = readFileSync(pluginPath, 'utf8');

  const requiredTokens = [
    'semanticColorPlugin',
    'accent',
    'gold',
    'borderRadius',
    'boxShadow',
    'transitionDuration',
    'transitionTimingFunction',
    'backgroundImage',
    'accent-subtle',
    'gradient-gold',
    'gold-glow',
    'duration-fast',
    'out-expo',
  ];

  const semanticTokens = ['--tw-canvas', '--tw-surface-1', '--tw-ink-primary', 'bg-canvas'];

  it.each(requiredTokens)('includes %s token definitions', (token) => {
    expect(configSource).toContain(token);
  });

  it.each(semanticTokens)('semantic plugin defines %s', (token) => {
    expect(pluginSource).toContain(token);
  });
});
