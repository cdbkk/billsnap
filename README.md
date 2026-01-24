# BillSnap

Mobile receipt and billing app for Thai small businesses. Generate receipts, accept PromptPay payments, and manage inventory from your phone.

## Features

- **Quick Mode** - Single-tap transactions for street vendors
- **Full Mode** - Itemized receipts with VAT calculation
- **PromptPay QR** - Generate payment QR codes instantly
- **Offline Support** - Works without internet, syncs when online
- **Bilingual** - Thai and English

## Tech Stack

- React Native 0.81 / Expo 54
- TypeScript (strict mode)
- Supabase (PostgreSQL + Auth + RLS)
- Expo Router

## Getting Started

```bash
npm install
cp .env.example .env.local
# Add your Supabase credentials
npm start
```

## Project Structure

```
app/           # Expo Router screens
components/    # UI components
lib/           # Business logic, hooks, i18n
supabase/      # Database migrations
```

## License

MIT

## Author

[@cdbkk](https://github.com/cdbkk) - [clearpath.cx](https://clearpath.cx)
