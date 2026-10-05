# Feature: Image transforms

As a signed-in creator
I want to upscale, colorize, revive, or remove the background of a photo
So that I can finish an existing image without writing a prompt

---

## Background

Given I am signed in
And I have enough credits for the transform

---

## Scenario: Upscale an uploaded image

Given I am on the upscaler
And I have uploaded a JPG, PNG, or WEBP under 5MB
When I upscale the image
Then an upscaled result is shown
And my credit balance decreases by the upscale cost

---

## Scenario: Upscale model from the address is selected

Given an upscale model id is in the page address
When I open the upscaler
Then that model is selected

---

## Scenario: Colorize an uploaded image

Given I am on the colorize tool
And I have uploaded an image
When I colorize the image
Then a colorized result is shown

---

## Scenario: Revive an uploaded image

Given I am on the revive tool
And I have uploaded an image
When I revive the image
Then a restored result is shown

---

## Scenario: Remove the background of an uploaded image

Given I am on background removal
And I have uploaded an image
When I remove the background
Then a result without the original background is shown

---

## Scenario: Transform without an image does not run

Given I am on the upscaler
And I have not uploaded an image
When I try to upscale
Then no transform starts

---

## Scenario: A file that is not an image is rejected

Given I am on a transform tool
When I upload a file that is not JPG, PNG, or WEBP
Then I see an error that the file type is not accepted
And no transform starts

---

## Scenario: An image over 5MB is rejected

Given I am on a transform tool
When I upload an image larger than 5MB
Then I see an error that the file is too large
And no transform starts

---

## Scenario: An unreadable image file is rejected

Given I am on a transform tool
When I upload a file that cannot be read as an image
Then I see an error that the file could not be read
And no transform starts

---

## Scenario: Signed-out visitor is asked to sign up before a transform

Given I am signed out
And I am on the upscaler with an image uploaded
When I upscale the image
Then a sign-up dialog is shown
And no transform starts

---

## Scenario: Low credits blocks a transform

Given my credit balance is below the transform cost
And I am on the colorize tool with an image uploaded
When I colorize the image
Then the Low credits dialog is shown
And no transform starts

---

## Scenario: An in-progress upscale can be resumed after reload

Given an upscale job is still running
When I reload the upscaler
Then I still see that job in progress

---

## Scenario: Uploaded source images are not restored after reload

Given I have uploaded an image on the upscaler
And I have not finished the upscale
When I reload the upscaler
Then the uploaded image is no longer attached
