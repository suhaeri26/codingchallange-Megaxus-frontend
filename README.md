# Frontend Documentation

## Overview

The frontend is built with Next.js, React, TanStack Query, and Tailwind CSS. It provides a polished experience for users to log in, view their balance, draw gacha, and for admins to manage the system.

## Run locally

1. Create the environment file:
   ```bash
   cp .env.example .env
   ```
   If you do not have an example file, create one with:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3030
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the app:
   ```bash
   npm run dev
   ```
4. Open the app at:
   ```text
   http://localhost:3000
   ```

## Main pages

- /dashboard: user dashboard with coin balance and gacha history
- /profile: user profile page
- /verify-email: email verification page
- /admin/items: manage reward items
- /admin/events: manage gacha events
- /admin/users: manage user balances
- /admin/gacha-history: live admin gacha log monitor with auto-refresh

## Feature highlights

- Responsive UI for desktop and mobile
- Real-time polling for admin gacha history every second
- Seamless API integration with generated React Query hooks
- Toast notifications for success and error states

## Build verification

You can verify the frontend build with:

```bash
npm run build
```
