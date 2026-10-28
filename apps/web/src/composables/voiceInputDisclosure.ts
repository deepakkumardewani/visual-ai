export const VOICE_INPUT_DISCLOSURE_STORAGE_KEY = 'visual-ai-voice-input-disclosure';

export const VOICE_INPUT_DISCLOSURE_TITLE = 'Voice input';

export const VOICE_INPUT_DISCLOSURE_BODY =
  'When you use the microphone, your speech will be sent to AI for processing.';

export const VOICE_INPUT_DISCLOSURE_CONFIRM = 'Continue';

export function hasAcceptedVoiceInputDisclosure(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return window.localStorage.getItem(VOICE_INPUT_DISCLOSURE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function acceptVoiceInputDisclosure(): void {
  try {
    window.localStorage.setItem(VOICE_INPUT_DISCLOSURE_STORAGE_KEY, '1');
  } catch {
    // private mode / SSR
  }
}
