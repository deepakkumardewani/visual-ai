# Feature: Community creations

As a signed-in member
I want to browse other people’s creations and open one
So that I can remix or reuse a result I like

---

## Scenario: Signed-in member sees the community feed

Given I am signed in
And other members have public creations
When I open Explore
Then I see Community Creations
And my own creations are not in the feed

---

## Scenario: Empty community feed explains that nothing is published yet

Given I am signed in
And no other member has a public creation
When I open Explore
Then I see that there are no community creations yet

---

## Scenario: Feed load failure offers a retry

Given I am signed in
And the community feed cannot be loaded
When I open Explore
Then I see that community creations could not be loaded
And I can try again

---

## Scenario: Load more appends the next page of creations

Given I am signed in
And the community feed has more than one page
When I choose Load more
Then the next creations are added to the feed

---

## Scenario: Signed-out visitor sees the Explore heading without a feed

Given I am signed out
When I open Explore
Then I see the Community Creations heading
And no creation tiles are loaded

---

## Scenario: Opening a creation shows its details

Given I am signed in
And a community creation exists
When I open that creation
Then I see the image, its prompt, and actions to share, download, remix, and enhance it

---

## Scenario: Missing creation explains that it could not be found

Given I am signed in
When I open an explore URL for a creation that does not exist
Then I see that the creation could not be found
And I can go back to Explore

---

## Scenario: Share copies the creation page address

Given I am signed in
And I am viewing a community creation
When I share it
Then the clipboard contains that creation’s page address

---

## Scenario: Next and previous move between creations

Given I am signed in
And I am viewing a creation that has a neighbor in the feed
When I go to the next creation
Then the address changes to that neighbor
And that neighbor’s image is shown

---

## Scenario: Remix opens the image generator with the creation’s prompt

Given I am signed in
And I am viewing a community creation
When I remix it
Then I am on the image generator
And the composer contains that creation’s prompt

---

## Scenario: Use as reference opens the generator with the image attached

Given I am signed in
And I am viewing a community creation
When I use it as a reference
Then I am on the image generator
And that image is shown as an attached reference
And the generation still uses only the prompt text
