# Feature: My assets

As a signed-in creator
I want to find, organize, and remove my past results
So that I can reuse work and keep the library tidy

---

## Background

Given I am signed in
And I am on Assets

---

## Scenario: Empty library explains that nothing has been created yet

Given I have no generations
Then I see that nothing is here yet
And the search and filter toolbar is hidden

---

## Scenario: Library lists my generations

Given I have at least one generation
Then I see that generation in the library
And I can search prompts and filter by type and size

---

## Scenario: Search narrows the library to matching prompts

Given I have generations with different prompts
When I search for a phrase that only one prompt contains
Then only generations whose prompts match are shown

---

## Scenario: Type filter shows one tool’s results

Given I have both a text-to-image result and an upscale result
When I filter type to Upscale
Then only upscale results are shown

---

## Scenario: Filters that match nothing explain the empty result

Given I have generations
When I apply search or filters that match none of them
Then I see that no results match my filters

---

## Scenario: Search and filters reset after a reload

Given I have filtered the library
When I reload Assets
Then the full library is shown again
And the previous search text is cleared

---

## Scenario: Download saves the selected image

Given I have a generation
When I download it
Then the image file is downloaded

---

## Scenario: Copy link copies the image file address

Given I have a generation
When I copy its link
Then the clipboard contains the image file address

---

## Scenario: Delete asks for confirmation and removes the image

Given I have a generation
When I delete it and confirm
Then that generation is no longer in the library

---

## Scenario: Dismissing delete keeps the image

Given I have a generation
When I delete it and cancel the confirmation
Then the generation is still in the library

---

## Scenario: Bulk delete removes every selected image

Given I have selected more than one generation
When I delete the selection and confirm
Then those generations are no longer in the library

---

## Scenario: Create a collection and add an image to it

Given I have a generation
When I create a collection and add that generation to it
Then the image appears when that collection is selected

---

## Scenario: Rename a collection

Given I have a collection
When I rename it
Then the library shows the new collection name

---

## Scenario: Delete a collection keeps the images in All

Given a collection contains an image
When I delete that collection
Then the collection is gone
And the image is still listed under All

---

## Scenario: A missing collection tells me to return to All

Given the selected collection no longer exists
Then I am told to switch to All to add images to a collection

---

## Scenario: Favorite marks an image

Given I have a generation
When I favorite it
Then that image is marked as a favorite
