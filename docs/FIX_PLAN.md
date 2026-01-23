# BillSnap Fix Plan

## Agent A: Database & Schema Fixes
**Files:** `supabase/migrations/`, `types/index.ts`

Tasks:
1. Create new migration `20240119000000_schema_fixes.sql`:
   - Add missing store_type enum values: `street_food`, `drinks`, `grocery`, `market`, `beauty`, `electronics`, `repair`
   - Add `shop_mode` column to shops table (enum: 'quick', 'normal', default 'normal')
   - Add `onboarding_completed_at` column to shops table
2. Update TypeScript Database types to match
3. Verify RLS policies still work

---

## Agent B: Offline Support & Caching
**Files:** `lib/hooks/`, `lib/cache.ts` (new), `lib/queue.ts` (new)

Tasks:
1. Create `lib/cache.ts` - AsyncStorage wrapper for caching:
   - Cache receipts locally with TTL
   - Cache shop data
   - Cache preset items
2. Create `lib/queue.ts` - Offline queue:
   - Queue receipt creation when offline
   - Sync queue when back online
   - Use NetInfo to detect connectivity
3. Update `useReceipts.ts`:
   - Load from cache first, then fetch
   - Save to cache after fetch
   - Add pagination (limit 50, offset-based)
4. Update `useShop.ts`:
   - Cache shop data locally
5. Add NetInfo dependency check

---

## Agent C: Auth & Session Fixes
**Files:** `app/(auth)/login.tsx`, `lib/auth/`, `lib/supabase.ts`

Tasks:
1. Fix OTP input - change from 8 boxes to 6
2. Update text from "8-digit code" to "6-digit code"
3. Fix SecureStore 2KB limit:
   - Chunk large values or use AsyncStorage for session
   - Add fallback handling
4. Add AppState listener in AuthContext:
   - Refresh session on app foreground
   - Handle token expiry gracefully
5. Sync onboarding state to Supabase (not just AsyncStorage)

---

## Agent D: UI/UX Fixes
**Files:** `app/(tabs)/`, `components/`, `constants/theme.ts`

Tasks:
1. Fix touch targets - all buttons minimum 48px:
   - `quantityButton` 36px → 48px
   - `deleteButton` 36px → 48px
   - Review all interactive elements
2. Add RefreshControl to:
   - `history.tsx`
   - `index.tsx` (dashboard)
   - `items.tsx`
3. Change success screen timeout 10s → 2s in QuickSale.tsx
4. Add keyboard dismiss on scroll (`keyboardDismissMode="on-drag"`)
5. Remove or implement stats tab (currently hidden dead code)
6. Lower receipt screenshot quality 1.0 → 0.8

---

## Agent E: Error Handling & Monitoring
**Files:** `lib/`, `components/`, `app.json`

Tasks:
1. Add Sentry or similar crash reporting:
   - Install expo-sentry or @sentry/react-native
   - Initialize in app entry
   - Wrap error boundaries
2. Add network status indicator:
   - Install @react-native-community/netinfo
   - Create `components/OfflineBanner.tsx`
   - Show banner when offline
3. Add retry logic to share functions:
   - Retry button on share fail
   - Don't lose receipt on error
4. Standardize haptics - remove Vibration API, use only expo-haptics
5. Add explicit Android permissions to app.json

---

## Agent F: Deep Linking & Polish
**Files:** `app/_layout.tsx`, `app.json`, `lib/linking.ts` (new)

Tasks:
1. Create deep link handler:
   - Handle `billsnap://` scheme
   - Route to appropriate screens
   - Handle OAuth callbacks properly
2. Add proper Google OAuth setup notes (or remove if not needed)
3. Clean up console.log statements (wrap in __DEV__)
4. Verify all date handling uses consistent timezone (UTC vs local)

---

## Dependency Additions Needed
```bash
npm install @react-native-community/netinfo @sentry/react-native
```

## Migration Order
1. Agent A (schema) - must run first
2. Agents B, C, D, E, F - can run in parallel after A
