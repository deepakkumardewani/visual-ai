import plugin from 'tailwindcss/plugin';

/** CSS variable map for runtime theme tokens (see src/style.scss). */
const TOKEN_VARS = {
  canvas: '--tw-canvas',
  'surface-1': '--tw-surface-1',
  'surface-2': '--tw-surface-2',
  'surface-3': '--tw-surface-3',
  ink: '--tw-ink',
  'ink-primary': '--tw-ink-primary',
  'ink-muted': '--tw-ink-muted',
  'ink-faint': '--tw-ink-faint',
  hairline: '--tw-hairline',
  border: '--tw-border',
  'border-light': '--tw-border-light',
};

const OPACITIES = [10, 15, 20, 30, 50, 60, 80];

function rgbVar(varName, opacity = 'var(--tw-bg-opacity, 1)') {
  return `rgb(var(${varName}) / ${opacity})`;
}

/** Generates tw-bg-*, tw-text-*, tw-border-* utilities bound to CSS variables. */
// eslint-disable-next-line @typescript-eslint/unbound-method
export default plugin(({ addUtilities }) => {
  const utilities = {};

  for (const [token, varName] of Object.entries(TOKEN_VARS)) {
    utilities[`.bg-${token}`] = {
      '--tw-bg-opacity': '1',
      backgroundColor: rgbVar(varName),
    };
    utilities[`.text-${token}`] = {
      '--tw-text-opacity': '1',
      color: rgbVar(varName, 'var(--tw-text-opacity, 1)'),
    };
    utilities[`.border-${token}`] = {
      '--tw-border-opacity': '1',
      borderColor: rgbVar(varName, 'var(--tw-border-opacity, 1)'),
    };
    utilities[`.ring-${token}`] = {
      '--tw-ring-opacity': '1',
      '--tw-ring-color': rgbVar(varName, 'var(--tw-ring-opacity, 1)'),
    };
    utilities[`.placeholder-${token}`] = {
      '&::placeholder': {
        color: rgbVar(varName, '1'),
        opacity: '1',
      },
    };
    utilities[`.divide-${token}`] = {
      '& > :not([hidden]) ~ :not([hidden])': {
        borderColor: rgbVar(varName, 'var(--tw-divide-opacity, 1)'),
      },
    };

    for (const opacity of OPACITIES) {
      const alpha = opacity / 100;
      utilities[`.bg-${token}\\/${opacity}`] = {
        backgroundColor: rgbVar(varName, String(alpha)),
      };
      utilities[`.text-${token}\\/${opacity}`] = {
        color: rgbVar(varName, String(alpha)),
      };
      utilities[`.border-${token}\\/${opacity}`] = {
        borderColor: rgbVar(varName, String(alpha)),
      };
      utilities[`.ring-${token}\\/${opacity}`] = {
        '--tw-ring-color': rgbVar(varName, String(alpha)),
      };
    }
  }

  addUtilities(utilities);
});
