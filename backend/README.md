# AuctionArc Backend

Express + MongoDB backend for the current AuctionArc frontend.

## What this backend covers

- Public auth for `Seller` and `Bidder`
- Admin bootstrap account from environment variables
- Age-restricted registration (18+)
- Profile picture upload support via Cloudinary
- Password reset code flow via email
- Seller, bidder, and admin dashboard endpoints
- Listings, auctions, bids, watchlists, messages, wallets, reports, and transactions
- Stripe checkout session support and webhook endpoint scaffold
- Database bootstrap/seed data aligned with the current frontend mock UI

## Quick start

1. Copy values into `backend/.env` and `frontend/.env` if needed.
2. Install dependencies:

```bash
npm install
```

3. Start the backend:

```bash
npm run dev
```

4. Seed manually if you want:

```bash
npm run seed
```

## Default behavior

- The server boots on `http://localhost:5000`
- API base path is `http://localhost:5000/api/v1`
- The admin account is created from `ADMIN_EMAIL` and `ADMIN_PASS`
- Sample seller/bidder marketplace data is seeded automatically when the database has no public users
- Stripe webhook verification is ready, but `STRIPE_WEBHOOK_SECRET` must be added before live webhook validation works

## Example seeded accounts

- Bidder: `bidder@auctionarc.com` / `Password@123`
- Seller: `seller@auctionarc.com` / `Password@123`
- Admin: uses `ADMIN_EMAIL` and `ADMIN_PASS` from `backend/.env`

## Main API areas

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me`
- `GET /api/v1/dashboard/seller`
- `GET /api/v1/dashboard/bidder`
- `GET /api/v1/dashboard/admin`
- `GET /api/v1/users/me/profile`
- `PATCH /api/v1/users/me/profile`
- `GET /api/v1/users/me/settings`
- `PATCH /api/v1/users/me/settings`
- `POST /api/v1/auctions/listings`
- `POST /api/v1/auctions/:auctionId/bids`
- `POST /api/v1/auctions/:auctionId/watchlist`
- `DELETE /api/v1/auctions/:auctionId/watchlist`
- `GET /api/v1/messages`
- `POST /api/v1/messages/:threadId/messages`
- `GET /api/v1/admin/*`
- `POST /api/v1/payments/checkout-session`
- `POST /api/v1/payments/webhook`

## Frontend alignment notes

- `frontend/.env` now exposes `NEXT_PUBLIC_API_BASE_URL`
- `frontend/.env` now uses the correct public Stripe key variable name for Next.js
- The backend response shapes are designed to mirror the current frontend mock-data cards, tables, and profile modules
