# Feature: AI image generation

As a signed-in creator
I want to describe an image and generate it with the options I chose
So that I get a result I can keep, share, or continue from

---

## Background

Given I am signed in
And I have enough credits for an image generation
And I am on the image generator at "/create"

---

## Scenario: Generate an image from a prompt

Given I have entered a prompt
When I generate the image
Then a completed image appears on the canvas
And my credit balance decreases by the generation cost

---

## Scenario: Empty prompt does not start a generation

Given the prompt is empty
When I try to generate
Then no generation starts
And I remain on the image generator

---

## Scenario: Keyboard shortcut submits the current prompt

Given I have entered a prompt
When I press the generate keyboard shortcut
Then a generation starts for that prompt

---

## Scenario: Low credits explains the shortfall instead of generating

Given my credit balance is below the generation cost
And I have entered a prompt
When I generate the image
Then the Low credits dialog is shown
And no generation starts

---

## Scenario: Low credits dialog can open the credit packs

Given the Low credits dialog is open
When I choose to buy credits from that dialog
Then the buy-credits dialog lists credit packs

---

## Scenario: A failed generation can be retried

Given I have entered a prompt
And the generation service fails
When I generate the image
Then I see an error that the request could not be processed
When I choose Retry
Then a new generation starts for the same prompt

---

## Scenario: Starter prompt fills the composer

Given the prompt is empty
And the canvas shows starter prompts
When I choose a starter prompt
Then that prompt is placed in the composer

---

## Scenario: Model and output options are kept after a reload

Given I have chosen a model, aspect ratio, image count, quality, and file format
When I reload the image generator
Then those choices are restored
And the prompt text is restored

---

## Scenario: Style and enhance choices are kept after a reload

Given I have chosen a style preset and an enhance mode
When I reload the image generator
Then the style preset and enhance mode are restored

---

## Scenario: Improve rewrites the current prompt

Given I have entered a prompt
When I choose Improve from the prompt AI menu
Then the prompt is replaced with the improved text

---

## Scenario: Random replaces the prompt with a suggested prompt

Given I am on the image generator
When I choose Random from the prompt AI menu
Then the prompt field contains a new suggested prompt

---

## Scenario: A saved prompt can be inserted

Given I have at least one saved prompt
When I choose that prompt from Saved prompts
Then the composer contains that saved prompt

---

## Scenario: Result can be downloaded

Given an image has finished generating
When I download the result
Then the image file is downloaded

---

## Scenario: Copy prompt copies the prompt that produced the result

Given an image has finished generating
When I copy the prompt from the result
Then the clipboard contains that prompt

---

## Scenario: More like this starts a related generation

Given an image has finished generating
When I choose More like this
Then a new generation starts from that result

---

## Scenario: Upscale this opens the upscaler with the result

Given an image has finished generating
When I choose Upscale this
Then I am on the upscaler
And the result image is the image to upscale

---

## Scenario: Remove background opens background removal with the result

Given an image has finished generating
When I choose Remove background
Then I am on background removal
And the result image is the image to process

---

## Scenario: Unknown create tool slug returns to the image generator

When I open "/create" with a feature slug that is not a real tool
Then I am on the image generator
And the unknown slug is not left in the address
