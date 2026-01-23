# Task: Redesign BillSnap Dashboard

**Status:** ✅ COMPLETED (2026-01-20)
**File:** `/Users/krook/bkk/bill/app/(tabs)/index.tsx`
**Summary:** `docs/status/dashboard-redesign-summary.md`

## Current Problems
1. FAB (+) overlaps with content and is redundant - Create is already in tab bar
2. Create New Receipt button is massive (takes 2/3 of row)
3. Manage Items is cramped and poorly styled
4. Overall layout feels unbalanced and cluttered

## Requirements
- 360px minimum width (Thai budget Android phones)
- 48px minimum touch targets
- Use existing theme from `@/constants/theme`
- Use existing hooks: `useShop`, `useReceipts`, `useTranslation`

## Design Direction: Emerald Ledger
- Primary: #00A86B (emerald green)
- Accent: #FBC02D (gold)
- Clean, professional, minimal

## What to Fix
1. **Remove the FAB entirely** - redundant with tab bar
2. **Quick Actions:** Two equal-sized cards side by side (Create Receipt, Manage Items) - same size, same weight
3. **Stats cards:** Keep but ensure they are compact
4. **Monthly Overview:** Keep but make it tighter
5. **Recent Receipts:** Keep the list, looks fine
6. **Pro Banner:** Move to bottom or remove - not priority

## Reference
- `@/components/ui` for Button, Card, Skeleton
- Keep the AnimatedButton pattern for touch feedback

## When Done
Write summary to `docs/status/dashboard-redesign-summary.md`
