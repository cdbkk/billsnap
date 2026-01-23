# BillSnap Testing Checklist

## Agent F - Deep Linking & Polish

### Deep Link Testing

#### Basic Deep Links
- [ ] `billsnap://new` - Opens new receipt screen
- [ ] `billsnap://receipts` - Opens receipts list
- [ ] `billsnap://settings` - Opens settings screen
- [ ] `billsnap://edit-shop` - Opens shop settings

#### Receipt Deep Links
- [ ] `billsnap://receipt/[valid-id]` - Opens receipt detail
- [ ] `billsnap://receipt/invalid` - Handles gracefully (404 or error)

#### Authentication Flow
- [ ] Deep link blocked when logged out → redirects to login
- [ ] Login deep link works when logged out
- [ ] Deep links work after successful login
- [ ] OAuth callback deep link sets session correctly

#### Onboarding Flow
- [ ] Deep link blocked during onboarding → redirects to onboarding
- [ ] Onboarding deep link works when needed
- [ ] Deep links work after onboarding complete

### Console Logging

#### Development Mode (__DEV__ = true)
- [ ] Login actions log to console
- [ ] Deep link parsing logs to console
- [ ] Queue sync logs to console
- [ ] Language changes log to console

#### Production Mode (__DEV__ = false)
- [ ] No debug logs in production build
- [ ] console.error still works (error tracking)
- [ ] Analytics still works

### Date Handling

#### Today's Total Calculation
- [ ] Receipt created at midnight UTC counts correctly
- [ ] Receipt created at 11:59 PM UTC counts correctly
- [ ] Receipt created yesterday doesn't count
- [ ] Receipt created tomorrow doesn't count (if system clock wrong)

#### Monthly Count
- [ ] First day of month counts correctly
- [ ] Last day of month counts correctly
- [ ] Previous month receipts don't count
- [ ] Next month receipts don't count

#### UTC Consistency
- [ ] `getTodayTotal()` uses UTC
- [ ] `createReceipt()` isToday check uses UTC
- [ ] Both methods return same results for same timestamp

### Offline Queue Sync

#### Queue Creation
- [ ] Receipt queued when offline
- [ ] Queued receipt shows in UI immediately
- [ ] Queue count increases
- [ ] Queued receipt has temp ID

#### Queue Sync
- [ ] `syncQueue()` syncs when online
- [ ] Synced receipts get real IDs from Supabase
- [ ] Queue count decreases after sync
- [ ] UI refreshes with synced data
- [ ] Failed syncs stay in queue

#### Network Detection
- [ ] Sync skipped when offline
- [ ] Sync runs when online
- [ ] Manual sync works via button
- [ ] Auto-sync on reconnect (if netinfo installed)

### Google Auth Documentation

#### Development (Expo Go)
- [ ] Web OAuth flow works
- [ ] Redirect URI generated correctly
- [ ] Tokens extracted from callback
- [ ] Session set in Supabase

#### Production Notes
- [ ] Documentation added to useGoogleAuth.ts
- [ ] iOS requirements listed
- [ ] Android requirements listed
- [ ] Alternative approaches documented

### Android Intent Filters

#### app.json Configuration
- [ ] `scheme: "billsnap"` present
- [ ] intentFilters array present
- [ ] VIEW action configured
- [ ] BROWSABLE and DEFAULT categories set

#### Testing
- [ ] `adb shell am start` opens app
- [ ] Browser links open app
- [ ] QR codes open app
- [ ] Share sheet shows app

## Manual Testing Scenarios

### Scenario 1: Share Receipt via Deep Link
1. Create a new receipt
2. Generate deep link: `billsnap://receipt/[id]`
3. Share link via Messages
4. Tap link on another device
5. ✅ Should open receipt detail

### Scenario 2: QR Code for New Receipt
1. Generate QR code with `billsnap://new`
2. Print or display QR code
3. Scan with camera app
4. ✅ Should open new receipt screen

### Scenario 3: Offline Queue
1. Turn off network
2. Create 3 receipts
3. Verify all show in UI
4. Turn on network
5. Call `syncQueue()`
6. ✅ All receipts synced to Supabase

### Scenario 4: Deep Link Authentication
1. Log out of app
2. Try to open `billsnap://receipts`
3. ✅ Should redirect to login
4. Log in
5. ✅ Should navigate to receipts

### Scenario 5: Google OAuth Flow
1. Tap "Sign in with Google"
2. Complete OAuth in browser
3. Browser redirects to billsnap://
4. ✅ Should extract tokens and log in
5. ✅ Should navigate to onboarding/home

## Automated Test Commands

### Type Checking
```bash
npx tsc --noEmit
```

### Deep Link Simulation (iOS)
```bash
xcrun simctl openurl booted "billsnap://new"
xcrun simctl openurl booted "billsnap://settings"
xcrun simctl openurl booted "billsnap://receipt/test-id"
```

### Deep Link Simulation (Android)
```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "billsnap://new" com.billsnap.app
```

### Check for Unwrapped Console Logs
```bash
grep -r "console\.log(" lib/ --include="*.ts" --include="*.tsx" | \
  grep -v "__DEV__"
# Should return nothing
```

## Pre-Production Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] No unwrapped console.log statements
- [ ] Error handling in all async functions
- [ ] Deep link parsing handles malformed URLs

### Security
- [ ] Deep links require authentication
- [ ] OAuth tokens validated before use
- [ ] Malicious redirect URLs blocked
- [ ] Queue data sanitized before sync

### Performance
- [ ] Deep links navigate < 100ms
- [ ] Queue sync doesn't block UI
- [ ] Date calculations optimized
- [ ] Cache invalidated after sync

### Documentation
- [ ] Deep linking guide complete
- [ ] Google Auth requirements documented
- [ ] Queue sync process documented
- [ ] Testing checklist complete

### Platform Specific
- [ ] iOS scheme configured in app.json
- [ ] Android intent filters configured
- [ ] Universal Links setup (optional)
- [ ] App Links setup (optional)

## Known Issues

### Network Detection
- `isOnline()` currently returns true (hardcoded)
- Install @react-native-community/netinfo for production
- Uncomment network listener in lib/queue.ts

### Google Sign-In
- Web OAuth only works in Expo Go
- Production needs native SDK setup
- See lib/auth/useGoogleAuth.ts for details

### TypeScript Errors
- DOM/RN type conflicts in node_modules
- Does not affect runtime
- Ignore unless affecting build

## Success Criteria

All tasks complete when:
1. ✅ Deep linking works for all routes
2. ✅ Console logs wrapped in __DEV__
3. ✅ Date handling uses UTC consistently
4. ✅ Queue sync implemented and tested
5. ✅ Google Auth documented for production
6. ✅ Android intent filters configured
7. ✅ Documentation complete
8. ✅ Tests pass
