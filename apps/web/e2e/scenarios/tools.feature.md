# Tools: watermarks, autocaption and sketch

Spec: `apps/web/e2e/qa/tools.spec.ts`. Paid POSTs are stubbed (MediaGenerationStub, GenerationStub); uploads hit the real API with fake storage.

## @critical image watermark runs and charges once

# evidence: apps/web/src/pages/ToolImageWatermark.vue

- Given an image and the watermark text
- When Generate is pressed
- Then one POST carries the upload id, the text and no default text, the result image and Download appear, one job is accepted

## @critical autocaption bills by 30 second block

# evidence: packages/shared/src/models/credits.ts, apps/web/src/components/Tools/CaptionResult.vue

- Given videos of 30, 31 and 120 seconds
- Then the cost badge reads 1, 2 and 4 blocks of credits
- And the transcript is shown as escaped plain text with Copy and Download

## @critical 402 and failure states for every tool

- Given image watermark, video watermark, autocaption and sketch
- When the server answers 402 or the job fails
- Then the low-credits dialog opens and nothing is queued, or "No credits were used." shows, and the balance is unchanged

## @high over-limit video rejected with copy

- Given a video reported longer than 120 seconds
- Then "Videos up to 2 minutes and 100 MB" shows, no file is attached and nothing is billed

## @high other file types rejected with copy

- Given a non-image file in the image tool
- Then "Choose a JPG, PNG or WEBP image." shows

## @high sketch generate uses the image cost

- Given a drawn sketch and a prompt
- Then the cost is the model's image cost and the POST carries the composition guidance

## @high handoff preloads the target

- Given a saved image asset
- When a tool or studio opens with ?asset=<id>
- Then the image is attached and the param is removed

## @high another user's asset shows not-found

- Given an asset owned by someone else
- Then the tool shows the not-found copy and attaches nothing

## @medium keyboard-only flows

## @medium 375px layout
