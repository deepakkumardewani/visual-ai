# Feature: Marketing pages

As a visitor
I want the public pages to explain the product and send me into the right tool
So that I can start creating or contact the team

---

## Scenario: Signed-out landing call to action goes to sign in

Given I am signed out
When I use the landing page primary call to action
Then I am on the sign-in page

---

## Scenario: Signed-in landing call to action opens the studio

Given I am signed in
When I use the landing page primary call to action
Then I am on the image generator

---

## Scenario: Landing tool cards open the matching feature page

Given I am on the landing page
When I open a tool card
Then I am on that tool’s feature page

---

## Scenario: Landing FAQ answer expands and collapses

Given I am on the landing page
When I expand a frequently asked question
Then its answer is visible
When I collapse that question
Then its answer is hidden

---

## Scenario: Showcase copy prompt copies the example prompt

Given I am on the landing page
When I copy a prompt from the showcase
Then the clipboard contains that example prompt

---

## Scenario: Feature page primary action opens the matching studio tool

Given I am signed in
When I use the primary action on the upscaler feature page
Then I am on the upscaler

---

## Scenario: Feature page secondary action opens pricing

When I use the secondary action on a feature page
Then I am on the pricing page

---

## Scenario: Contact form rejects incomplete details

Given I am on the contact page
When I submit the form with required fields missing
Then the message is not sent

---

## Scenario: Contact form confirms a successful send

Given I am on the contact page
And my name, last name, email, subject, and message are valid
When I send the message
Then I see that the message was sent successfully

---

## Scenario: Contact form reports a send failure

Given I am on the contact page
And my name, last name, email, subject, and message are valid
And the contact service fails
When I send the message
Then I see that the message failed to send

---

## Scenario: Signed-in contact form starts with my name and email

Given I am signed in
When I open the contact page
Then the name and email fields are filled from my account

---

## Scenario: Compare model action opens the upscaler with that model

Given I am on the compare page
When I choose Use this model on a comparison
Then I am on the upscaler
And that model is selected

---

## Scenario: Examples tabs swap the before-and-after set

Given I am on the examples page
When I choose another example tab
Then the before-and-after images for that tab are shown

---

## Scenario: Gallery tile opens a fullscreen view

Given I am on the gallery page
When I open an image tile
Then that image is shown fullscreen

---

## Scenario: Old dashboard address opens the studio tool from the query

When I open the dashboard address with a valid upscale tool query
Then I am on the upscaler
And the other query parameters are kept

---

## Scenario: Old dashboard address without a tool opens the image generator

When I open the dashboard address without a tool query
Then I am on the image generator

---

## Scenario: Legal pages are readable and link to contact

When I open the terms page
Then the terms text is shown
And I can follow a link to the contact page
