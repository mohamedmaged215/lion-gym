# Lion Gym

Gym subscriptions and expense tracking built with Next.js and Firebase Auth/Firestore.

## Run locally

```bash
npm ci
npm run dev
```

Open `http://localhost:3000` and sign in with an existing Firebase Auth account.

## Data flow

- The dashboard requests Firestore aggregates. The selected month applies to revenue and expenses; membership status cards always describe today.
- Subscriptions initially load the 25 most recent start dates. The month input limits the list to a selected month, and **Show older subscriptions** loads the next page. Name/phone search loads the full matching month (or all customers if no month is selected) so search remains complete.
- New subscriptions and renewals write customer and payment records in one Firestore batch. Existing payment amounts are never rewritten when a customer price changes.
- The expenses list loads 25 records at a time. Its total comes from a Firestore sum aggregate.

Firestore Security Rules and administrator access remain managed in the existing Firebase project.
