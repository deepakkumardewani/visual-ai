# Feature: Sign in and route protection

As a visitor
I want to sign in and reach only the screens I am allowed to see
So that private creations and my account stay behind a session

---

## Scenario: Signed-out visitor is sent to sign in from a protected profile URL

Given I am signed out
When I open the profile page directly
Then I am on the sign-in page
And the address keeps a redirect back to the profile page

---

## Scenario: Signed-out visitor is sent to sign in from a community creation URL

Given I am signed out
When I open a community creation by its direct URL
Then I am on the sign-in page
And the address keeps a redirect back to that creation

---

## Scenario: Signed-out visitor can open the studio without an account

Given I am signed out
When I open the create page
Then the studio is visible
And I am not redirected to sign in

---

## Scenario: Generate while signed out asks the visitor to create an account

Given I am signed out
And I am on the image generator with a prompt entered
When I submit the generation
Then a sign-up dialog is shown
And no generation starts

---

## Scenario: Header sign-in opens the sign-in page

Given I am signed out
When I choose Sign In in the header
Then I am on the sign-in page

---

## Scenario: Signed-in user can open the profile page

Given I am signed in
When I open the profile page
Then I see my profile
And I am not sent to sign in
