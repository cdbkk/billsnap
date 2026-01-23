# BillSnap Deep Linking Guide

## Overview

BillSnap supports deep linking using the `billsnap://` URL scheme. This allows the app to be opened from:
- QR codes
- SMS/Messages
- Email links
- Web browsers
- Other apps
- Push notifications

## Supported Deep Links

### Receipt Detail
```
billsnap://receipt/[receipt-id]
```
Opens the receipt detail screen for a specific receipt.

**Example:**
```
billsnap://receipt/550e8400-e29b-41d4-a716-446655440000
```

### New Receipt
```
billsnap://new
```
Opens the new receipt creation screen.

### Receipts List
```
billsnap://receipts
```
Opens the receipts history screen.

### Settings
```
billsnap://settings
```
Opens the app settings screen.

### Shop Settings
```
billsnap://edit-shop
```
Opens the shop configuration screen.

## How to Test

### iOS Simulator
```bash
xcrun simctl openurl booted "billsnap://new"
xcrun simctl openurl booted "billsnap://receipt/abc123"
xcrun simctl openurl booted "billsnap://settings"
```

### Android Emulator
```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "billsnap://new" com.billsnap.app

adb shell am start -W -a android.intent.action.VIEW \
  -d "billsnap://receipt/abc123" com.billsnap.app
```

### macOS (if app is installed)
```bash
open "billsnap://new"
open "billsnap://receipt/123"
```

### From Browser
Simply visit the URL in Safari/Chrome:
```
billsnap://new
```

## QR Code Generation

Generate QR codes for quick actions:

### New Receipt QR Code
```
Data: billsnap://new
```

### Specific Receipt QR Code
```
Data: billsnap://receipt/550e8400-e29b-41d4-a716-446655440000
```

**Use cases:**
- Share receipt with customer via QR code
- Print QR code on business card to open app
- Link to specific receipt in printed materials

## Security

### Authentication Required
Deep links are protected by authentication:
- User must be logged in to access most routes
- Login/OAuth routes are accessible without auth
- Redirects to login if not authenticated

### Onboarding Check
- Routes blocked if onboarding not complete
- User redirected to onboarding first
- Only onboarding route accessible during setup

### Implementation
```typescript
// From app/_layout.tsx
const handleDeepLink = (url: string) => {
  const parsed = parseDeepLink(url);
  if (!parsed) return;

  // Block non-auth routes if not logged in
  if (!user && !parsed.route.includes('login')) {
    return;
  }

  // Block non-onboarding routes if setup incomplete
  if (user && !isOnboardingDone && !parsed.route.includes('onboarding')) {
    return;
  }

  router.push(parsed.route);
};
```

## Implementation Details

### Configuration Files

**app.json** - URL scheme registration
```json
{
  "expo": {
    "scheme": "billsnap",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [{ "scheme": "billsnap" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

**lib/linking.ts** - Deep link configuration
```typescript
export const linking = {
  prefixes: [
    Linking.createURL('/'),
    'billsnap://',
    'exp://',
  ],
  config: {
    screens: {
      '(auth)': { screens: { login: 'login' } },
      'onboarding': 'onboarding',
      '(tabs)': {
        screens: {
          index: '',
          new: 'new',
          receipts: 'receipts',
          settings: 'settings',
        },
      },
      'receipt/[id]': 'receipt/:id',
      'edit-shop': 'edit-shop',
    },
  },
};
```

**app/_layout.tsx** - Deep link handler
```typescript
useEffect(() => {
  // Initial URL
  Linking.getInitialURL().then(handleDeepLink);

  // Runtime URLs
  const subscription = Linking.addEventListener('url', (event) => {
    handleDeepLink(event.url);
  });

  return () => subscription.remove();
}, [user, isOnboardingDone]);
```

### Utility Functions

**parseDeepLink(url)** - Parse billsnap:// URL
```typescript
import { parseDeepLink } from '@/lib/linking';

const result = parseDeepLink('billsnap://receipt/123');
// { route: '/receipt/123', params: undefined }
```

**createDeepLink(route)** - Generate billsnap:// URL
```typescript
import { createDeepLink } from '@/lib/linking';

const url = createDeepLink('receipt/123');
// 'billsnap://receipt/123'
```

## Use Cases

### 1. Share Receipt with Customer
```typescript
import { Share } from 'react-native';
import { createDeepLink } from '@/lib/linking';

async function shareReceipt(receiptId: string) {
  const url = createDeepLink(`receipt/${receiptId}`);
  await Share.share({
    message: `View your receipt: ${url}`,
    url, // iOS will use this
  });
}
```

### 2. QR Code for Quick Receipt Creation
```typescript
import QRCode from 'react-native-qrcode-svg';
import { createDeepLink } from '@/lib/linking';

function NewReceiptQR() {
  const url = createDeepLink('new');

  return (
    <QRCode
      value={url}
      size={200}
    />
  );
}
```

### 3. Push Notification to Receipt
```typescript
// When sending push notification
{
  title: "Receipt Created",
  body: "Tap to view receipt #123",
  data: {
    url: "billsnap://receipt/abc123"
  }
}
```

## OAuth Redirects

Google Sign-In OAuth uses deep links:

```
billsnap://login?access_token=xxx&refresh_token=yyy
```

The handler in `app/_layout.tsx` automatically:
1. Detects OAuth callback
2. Extracts tokens
3. Sets Supabase session
4. Navigates to app

## Troubleshooting

### Deep Link Not Working

**iOS:**
1. Check scheme in app.json matches URL
2. Rebuild app after changing scheme
3. Use `xcrun simctl openurl` to test
4. Check console for "Received deep link:" log

**Android:**
1. Verify intentFilters in app.json
2. Check package name matches
3. Use `adb shell am start` to test
4. Check logcat for navigation events

### Authentication Issues
- Deep link blocked → Check if user is logged in
- Redirect to login → Expected for protected routes
- Deep link works but wrong screen → Check route parsing

### Development Mode
- Expo Go uses `exp://` scheme in dev
- Production uses `billsnap://` scheme
- Both are configured in linking.ts

## Production Considerations

### Universal Links (iOS)
For production, consider Apple Universal Links:
1. Requires domain verification
2. Falls back to billsnap:// if app not installed
3. Better user experience (no browser prompt)

**Setup:**
```json
{
  "ios": {
    "associatedDomains": ["applinks:billsnap.app"]
  }
}
```

### App Links (Android)
For production, consider Android App Links:
1. Requires assetlinks.json on web domain
2. Auto-opens app without prompt
3. Verified domain ownership

**Setup:**
```json
{
  "android": {
    "intentFilters": [{
      "action": "VIEW",
      "autoVerify": true,
      "data": {
        "scheme": "https",
        "host": "billsnap.app"
      }
    }]
  }
}
```

## References

- **Expo Linking:** https://docs.expo.dev/guides/linking/
- **Expo Router:** https://docs.expo.dev/router/reference/linking/
- **Deep Link Testing:** https://docs.expo.dev/guides/linking/#testing-urls
- **Universal Links:** https://developer.apple.com/ios/universal-links/
- **App Links:** https://developer.android.com/training/app-links
