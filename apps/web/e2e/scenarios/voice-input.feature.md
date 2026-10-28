# STT: voice input in composer

# evidence: useVoiceInput.ts, useGrokRecorder.ts, useWebSpeech.ts, MicButton.vue, EngineMenu.vue, Waveform.vue

## @critical Grok engine: mocked `getUserMedia`/`MediaRecorder` and intercepted `**/stt`; recorded text appends to existing prompt without replacing it.

## @critical Web Speech engine: mocked `SpeechRecognition` shows interim text live and commits on finalize.

## @high Engine choice persists across reload; with `SpeechRecognition` removed, default is Grok and Web Speech shows "Not supported in this browser".

## @high Error states: permission denied, `**/stt` 429 (minutes message), 5xx, empty text each show a visible message.

## @high Esc cancels recording; recording stops on tab hidden.

## @medium 60s auto-stop with countdown from 10s (fake clock); reduced-motion renders the level meter; layout at 375px.
