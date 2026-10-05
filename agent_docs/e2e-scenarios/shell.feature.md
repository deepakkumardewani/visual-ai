# Feature: App shell

As a member
I want the header, theme, and studio navigation to stay consistent
So that I can move between tools and keep my display preference

---

## Scenario: Studio navigation switches tools

Given I am on the image generator
When I open the upscaler from the studio navigation
Then I am on the upscaler
When I open Assets from the studio navigation
Then I am on my asset library

---

## Scenario: Theme choice is kept after reload

Given I am signed in
When I switch the theme from the user menu
And I reload the page
Then the same theme is still applied

---

## Scenario: Signed-out theme control is available on the studio

Given I am signed out
When I view the studio
Then I can switch between light and dark theme

---

## Scenario: User menu shows account actions when signed in

Given I am signed in
When I open the user menu
Then I can open my profile
And I can sign out

---

## Scenario: Signing out returns me to a signed-out header

Given I am signed in
When I sign out from the user menu
Then the header shows Sign In
And the studio remains available
