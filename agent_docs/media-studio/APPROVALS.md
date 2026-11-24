# Media Studio Approvals

Source: `agent_docs/media-studio/TASKS.md` (open questions and defaults), SPEC R-INF-5, R-INF-14, R-INF-17, R-TTS-11, PLAN section 2.

## New Mongo collections

- MediaAsset: approved 2026-11-16 by the owner.
- MediaUpload (24h TTL): approved 2026-11-16 by the owner.
- Voice: NOT NEEDED (not built). Voice cloning dropped by owner decision, 2026-11-24.
- VoiceConsent (append-only): NOT NEEDED (not built). Voice cloning dropped by owner decision, 2026-11-24.

## New npm packages

- wavesurfer.js: approved 2026-11-16 by the owner.
- @breezystack/lamejs: approved 2026-11-16 by the owner.

## Open questions G1 to G14

- G1: default applied. P-Video audio cost is billed on stored audio duration clamped to 20 seconds and shown as Estimated.
- G2: default applied. The `/media/*` endpoints are not named in the spec; the plan's names are used.
- G3: default applied. One combined history cap for images plus media.
- G4: NOT NEEDED (voice cloning dropped 2026-11-24; no consent record is built).
- G5: NOT NEEDED (voice cloning dropped 2026-11-24; no voice limit is built).
- G6: default applied. `blockSec` is added to the pricing unit for Autocaption.
- G7: default applied. One HTMLAudioElement is shared with wavesurfer.
- G8: default applied. StudioPlaceholder renders until a page ships.
- G9: resolved 2026-11-16. The four new collections above are approved by the owner.
- G10: resolved 2026-11-16. VIDEO_WATERMARK_PLACEMENT is sourced in two steps: (1) free, read the model's published source and public example outputs; (2) only if step 1 does not determine the position, exactly one owner-approved real paid run of charlesmccarthy/addwatermark, maximum one call ever, made only by the main orchestrator session after telling the user the endpoint, expected cost and that it is call 1 of 1. If step 1 answers it, no paid call is made. The mock-only rule stays intact for all tests and e2e.
- G11: default applied. FeatureType.SKETCH is for routing, nav and labels only; sketch results are written like a normal image and appear under the Images history filter.
- G12: default applied. Lyrics section and condense are multiplexed on POST /prompt/lyrics.
- G13: default applied. The existing runGenerationJob order is kept and matches SPEC R-INF-6: run on Replicate, persist the record, deduct once, copy to Cloudinary, complete.

## Other resolutions (2026-11-16)

- G14: resolved 2026-11-16, default accepted. The Song sample loop row (R-SONG-8) renders only when SONG_SAMPLE_LOOP_URL is set; the 3 example ideas still show.
- Q5: CANCELLED 2026-11-24. The paid voice-clone test call is cancelled: 0 of 1 made (no call 1 of 1), and none will be. No paid call was made.
- Q6: resolved 2026-11-16, default accepted. Credits only; every media model has `tier: 'standard'`; no Pro gating.
- Q8: resolved 2026-11-16, default accepted. The drafted commercial-use copy and the consent sentence ship as written; legal may revise later without a spec change.

## Voice cloning descope (2026-11-24)

- Voice cloning is dropped from the product by owner decision on 2026-11-24 (SPEC R-TTS-10 descoped).
- The Q5 test call is cancelled: 0 of 1 made, none will be. No paid Replicate call was made.
- Voice and VoiceConsent collections, CLONE_CONSENT_TEXT and CURRENT_CONSENT_VERSION, and gaps G4 and G5 are NOT NEEDED (not built).
