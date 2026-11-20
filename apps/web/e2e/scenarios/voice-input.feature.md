# Voice input (prompt bar mic)

# evidence: useVoiceInput.ts, useGrokRecorder.ts, MicButton.vue, Waveform.vue, VoiceDisclosureDialog.vue

## @critical Grok STT: mocked `getUserMedia`/`MediaRecorder` and intercepted `**/stt`; recorded text appends to existing prompt without replacing it.

## @critical First mic use shows AI processing disclosure once; acceptance persists in localStorage.

## @high Error states: permission denied, `**/stt` 429 (minutes message), 5xx, empty text each show a visible message.

## @high Esc cancels recording; recording stops on tab hidden.

## @medium 60s auto-stop with countdown from 10s (fake clock); reduced-motion renders the level meter; layout at 375px.
