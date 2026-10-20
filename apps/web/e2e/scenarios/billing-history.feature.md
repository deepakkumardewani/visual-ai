# Billing history (Profile → Payments)

# evidence: apps/web/src/components/Profile/Payments.vue, apps/web/src/pages/Profile.vue (`?tab=payments`)

## @high Dodo and legacy Razorpay-shaped rows both render in Profile -> Payments

Given a signed-in user with a Dodo payment row created via checkout and a signed webhook
And the user fetch is intercepted to append a legacy row without `provider`
When they open Profile → Payments
Then both the Dodo pack description and the legacy description appear in the receipts table

## @medium Empty state when the user has no payments

Given the user fetch returns an empty `payments` array
When they open Profile → Payments
Then they see the empty state with "No receipts yet"

## @medium Payment rows persist after reload

Given a Dodo payment row exists from checkout and webhook
When they open Profile → Payments and reload the page
Then the same payment description is still visible

## @medium Deep link opens Profile -> Payments directly

When a signed-in user navigates to `/profile?tab=payments`
Then the Payments tab is selected and the Receipts panel is shown
