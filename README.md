# PawStay

Find the perfect stay, grooming & vet care for your pet.

## Getting Started

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd PawStay

# Install dependencies
npm i

# Start the development server
npm run dev
```

## Technologies

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase

## Stripe Setup

To enable card payments via Stripe Checkout, add these environment variables in the backend runtime (for local development, use `backend/.env`):

```env
STRIPE_SECRET_KEY=sk_test_xxx
FRONTEND_URL=http://localhost:5173
```

Notes:

- `STRIPE_SECRET_KEY` is required for both creating checkout sessions and verifying paid sessions.
- `FRONTEND_URL` is used for Stripe success/cancel redirects when the request origin cannot be inferred.
