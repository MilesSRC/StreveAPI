# Changes (May 22nd 2024)
Author: **MilesSRC**

# User.ts
- Added fullName field

# ServicePackage.ts
- Added servicePackages for display on the front page
- These are for when a user creates a service with a certain specification (service packages)

# Invoice.ts
- Integrates with Stripe to manage invoices internally and with Stripe

# Service.ts
- Added ``.activeInvoice`` field for linking back to the active invoice for the service upon creation or billing date approach.
- Added new status' for fraud prevention

# routes/services.ts
- Added Create & Read, still working out Stripe integration

# routes/users.ts
- Upon creation, a stripe customer will be attempted to be created for the user.

# Types
Types have changed to accomidate new models/etc.

# Future Me (Continuing this)
We we're working on learning Stripe Products / Pricing and Linking them to Stripe Subscriptions
to eventually create Invoices (hopefully automatically)

Links:
https://docs.stripe.com/billing/subscriptions/overview
https://docs.stripe.com/api/products/create
https://docs.stripe.com/api/invoices/create
https://docs.stripe.com/api?lang=node