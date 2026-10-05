# Feature: Profile, credits, and payments

As a signed-in member
I want to see my credits, receipts, and referral options
So that I know what I can spend and how to get more

---

## Background

Given I am signed in

---

## Scenario: Profile shows the credits balance

When I open the profile page
Then I see my current credit balance

---

## Scenario: Profile tabs are reachable from the address

When I open the profile page on the Payments tab
Then I see my payment history

---

## Scenario: Empty payment history can start a credit purchase

Given I have no receipts
When I open the Payments tab
Then I see an empty payment history
And I can open the buy-credits dialog from that empty state

---

## Scenario: Credits card opens the buy-credits dialog

When I open the profile page
And I choose to buy credits from the credits card
Then the buy-credits dialog lists credit packs in rupees
And it states that payment is via Razorpay

---

## Scenario: A failed credit purchase does not add credits

Given the buy-credits dialog is open
And the payment fails
When I try to buy a pack
Then I do not see a payment-successful confirmation
And my credit balance is unchanged

---

## Scenario: A successful credit purchase increases the balance

Given the buy-credits dialog is open
When I complete payment for a pack
Then I see that payment was successful
And the dialog closes
And my credit balance includes the purchased credits

---

## Scenario: Pricing page lists packs and starts checkout

When I open the pricing page
Then I see credit packs with a buy action for each pack
When I buy a pack and complete payment
Then my credit balance includes that pack’s credits

---

## Scenario: Apply a valid referral code

Given I have a 6-character referral code that is not my own
When I apply it from Use Referral Code
Then the code is accepted
And my credit balance increases by the referral reward

---

## Scenario: My own referral code is rejected

Given I open Use Referral Code
When I enter my own referral code
Then the code is not accepted
And my credit balance does not change

---

## Scenario: Share referral copies the invite

When I choose Refer and Earn Credits
And I copy the invite
Then the clipboard contains my referral invite
And I see confirmation that it was copied

---

## Scenario: Dashboard referral offer invites me to earn credits

Given I am on the studio
Then the header offers to earn credits by referring a friend

---

## Scenario: A small remaining balance is visually distinct on the studio

Given my remaining credits are between 1 and 3
When I view the studio header
Then the credits display uses the low-balance treatment

---

## Scenario: A zero balance does not use the low-balance treatment

Given my remaining credits are 0
When I view the studio header
Then the credits display does not use the low-balance treatment

---

## Scenario: Favorites tab lists images I marked

Given I have favorited at least one generation
When I open the Favorites tab on my profile
Then I see that favorited image
