# Billing: purchase credits (Dodo)

# evidence: apps/web/src/components/Dialogs/BuyMoreCreditsDialog.vue, apps/web/src/payments/usePurchase.ts, agent_docs/SPEC_dodo_payments.md §7

## @critical Buy dialog lists the 4 credit packs

Given a signed-in user on the studio
When they open the buy-credits dialog
Then all four catalog packs (200, 450, 960, 2000 credits) are listed

## @critical Checkout request sends the pack id only

Given the buy-credits dialog is open with a pack selected
When the user confirms purchase
Then POST `/payments/checkout` body contains only `{ packId }` matching the selected pack

## @critical Signed payment success grants exactly the pack's credits and shows the row in Profile -> Payments

Given a checkout session was created for a pack
When the overlay closes and a valid signed `payment.succeeded` webhook is delivered for that session
Then paid credits increase by exactly the pack amount once
And Profile → Payments shows a completed row for that purchase

## @critical Duplicate webhook delivery is a no-op

Given credits were already granted for a payment
When the same signed webhook is posted again
Then paid credits do not increase a second time

## @high Invalid signature gets 401 and credits are unchanged

Given a checkout session exists
When a webhook POST uses a tampered signature
Then the API responds 401
And paid credits are unchanged

## @high Failed payment shows an error and credits are unchanged

Given a checkout session exists
When the overlay closes and a signed `payment.failed` webhook is delivered
Then the user sees a payment-failed message
And paid credits are unchanged

## @medium Overlay closed then poll timeout shows the processing message

Given a checkout session exists
When the overlay closes without a webhook and the 60s poll window elapses
Then the user sees the payment-processing message
And paid credits are unchanged
