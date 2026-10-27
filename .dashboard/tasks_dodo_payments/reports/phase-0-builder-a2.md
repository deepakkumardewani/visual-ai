# Phase 0 builder a2

- T0.1: sanity-checked, T0.1-plugin line present (PLAN L311).
- T0.2: five T0.2-\* lines present (L313-317); skills grep matches; task_built logged.
- T0.3: BLOCKED. Needs live dodo-knowledge queries (no MCP tools, curl blocked). Local plugin skills have no cited doc URLs/snippets; the only INR evidence (T0.2-docs-query) is ambiguous on INR as product base currency. Not fabricating.
- T0.4: not started (depends on T0.3).

Queries for orchestrator (write results as T0.3-item1..6 lines in PLAN with source URLs):

1. "Is INR supported as a product base currency for one-time products, and what is the difference between Adaptive Currency and Localized Pricing?"
2. "Does checkoutSessions.create accept a metadata param, what are the response field names (checkout_url, session_id), and is metadata echoed on the payment.succeeded webhook payload (exact path)?"
3. "payment.succeeded and payment.failed webhook payload fields: payment_id, total_amount, currency, status, checkout_session_id, payment_method; what payment_method values are reported and is UPI available for INR in test mode?"
4. "Webhook signature verification: client.webhooks.unwrap vs standardwebhooks library, timestamp tolerance, header names webhook-id/webhook-signature/webhook-timestamp, raw body requirement in Express"
5. "Overlay checkout SDK npm package name (dodopayments-checkout vs @dodopayments/checkout), onEvent event names, is there a checkout success event, return_url behavior in an SPA, is window.DodoPayments exposed as a global"
6. "Test mode test cards, live environment string for the SDK (environment: live_mode vs test_mode), webhook retry schedule, Get Checkout Session SDK method name and response fields payment_id and payment_status"
