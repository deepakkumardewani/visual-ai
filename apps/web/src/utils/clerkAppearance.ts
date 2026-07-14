import type { Appearance } from '@clerk/types';

/** Clerk UI themed to Visual AI dark editorial gallery (DESIGN.md). */
export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: '#C9A84C',
    colorBackground: '#0F0C09',
    colorInputBackground: '#17120E',
    colorInputText: '#F0E8DC',
    colorText: '#F0E8DC',
    colorTextSecondary: '#AC9C8C',
    colorTextOnPrimaryBackground: '#0D0A07',
    colorNeutral: '#F0E8DC',
    colorDanger: '#DC2626',
    borderRadius: '0.5rem',
    fontFamily: '"Source Sans 3", system-ui, sans-serif',
    fontFamilyButtons: '"Source Sans 3", system-ui, sans-serif',
  },
  elements: {
    rootBox: {
      width: '100%',
      maxWidth: '420px',
    },
    card: {
      background: 'rgb(15 12 9)',
      boxShadow: 'none',
      border: '1px solid rgb(64 52 40 / 0.85)',
    },
    headerTitle: {
      fontFamily: '"Young Serif", Georgia, serif',
      fontWeight: '400',
      letterSpacing: '-0.01em',
    },
    headerSubtitle: {
      color: '#AC9C8C',
    },
    socialButtonsBlockButton: {
      background: 'rgb(23 18 14)',
      borderColor: 'rgb(64 52 40)',
      color: '#F0E8DC',
    },
    socialButtonsBlockButtonText: {
      color: '#F0E8DC',
    },
    dividerLine: {
      background: 'rgb(58 47 36)',
    },
    dividerText: {
      color: '#AC9C8C',
    },
    formFieldLabel: {
      color: '#AC9C8C',
    },
    formFieldInput: {
      background: 'rgb(23 18 14)',
      borderColor: 'rgb(64 52 40)',
      color: '#F0E8DC',
    },
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #E8C96B 0%, #C9A84C 50%, #9E7D35 100%)',
      color: '#0D0A07',
      boxShadow: '0 0 28px rgba(201, 168, 76, 0.28)',
      fontWeight: '600',
    },
    footerActionLink: {
      color: '#C98A5A',
    },
    identityPreviewEditButton: {
      color: '#C98A5A',
    },
    formFieldAction: {
      color: '#C98A5A',
    },
  },
};
