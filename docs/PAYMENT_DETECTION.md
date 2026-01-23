# Payment Detection Strategy

## The Problem

PromptPay (Thailand's instant payment system) has **no public API** for detecting incoming payments to personal accounts. Thai banks don't expose webhooks or transaction notifications for regular consumers.

### What Exists (But Won't Work For Us)

| Option | Why It Won't Work |
|--------|-------------------|
| Payment Gateways (Omise, Stripe, 2C2P) | Requires merchant registration, fees (0.25-2.65%), users must sign up separately |
| Bank Open APIs (SCB, KBank, BBL) | Business/merchant accounts only, no personal account access |
| Direct Bank Integration | No public APIs for personal PromptPay IDs |

### What We Already Have

- PromptPay QR generation via `promptpay-qr` library
- Users can set their PromptPay ID (phone or national ID)
- QR displays on receipt creation screen
- Customer scans → pays via their banking app → money arrives

**The gap:** We show the QR, customer pays, but we have no way to know payment happened.

---

## Our Solution: Hybrid Approach

### For All Users (Free + Pro)

**Manual Confirmation Flow:**
1. Receipt created → Show PromptPay QR
2. Display "Waiting for payment..." screen
3. Vendor sees payment notification on their phone (from banking app)
4. Vendor taps "Payment Received" button in BillSnap
5. Receipt marked as paid

This is how most Thai street vendors operate anyway - they watch for the bank notification.

### For Pro Users on Android Only

**Auto-Detection via Notification Listening:**
1. User grants "Notification Access" permission (one-time setup in Android Settings)
2. App listens for incoming notifications from banking apps
3. When bank notification arrives, parse for payment amount
4. Match against pending receipts
5. Prompt: "Did you just receive ฿500 from payment?"
6. One-tap confirmation

**Supported Banking Apps to Monitor:**
- K PLUS (Kasikorn)
- SCB Easy
- Krungthai NEXT
- Bangkok Bank Mobile
- Krungsri Mobile
- TTB Touch
- (Add more as needed)

---

## Platform Limitations

### Android

**Possible via NotificationListenerService**

- Expo module: [`expo-android-notification-listener-service`](https://github.com/SeokyoungYou/expo-android-notification-listener-service)
- Requires: Development build (not Expo Go)
- Permission: User must manually enable in Settings → Apps → Special Access → Notification Access
- Privacy note: This permission allows reading ALL notifications - users may be hesitant

### iOS

**NOT POSSIBLE**

Apple does not allow apps to read notifications from other apps. This is a hard platform restriction with no workaround.

- No NotificationListenerService equivalent
- No API access to Notification Center
- New iOS 26.3 "Notification Forwarding" is EU-only and for external hardware devices only

**Therefore: Auto-detection is Android Pro feature only. iOS users always use manual confirmation.**

---

## Feature Matrix

| Feature | Free (Android) | Free (iOS) | Pro (Android) | Pro (iOS) |
|---------|---------------|------------|---------------|-----------|
| PromptPay QR Generation | Yes | Yes | Yes | Yes |
| Manual "Payment Received" | Yes | Yes | Yes | Yes |
| Notification Auto-Detection | No | No | **Yes** | No |
| Smart Payment Matching | No | No | **Yes** | No |

---

## Implementation Plan

### Phase 1: Manual Confirmation (All Users)

1. **Waiting Screen Component**
   - Shows after QR is displayed
   - Pulsing animation to indicate waiting
   - Large "Payment Received" button
   - "Cancel" option to abandon
   - Auto-timeout after 15 minutes → mark as abandoned/pending

2. **UX Flow**
   ```
   Create Receipt → Show QR → "Waiting for payment..."
                                    ↓
                    [Payment Received]  [Cancel]
                           ↓                ↓
                    Mark as Paid      Mark as Pending
   ```

3. **Receipt Status Updates**
   - Update Supabase `receipts.status` field
   - Show confirmation animation/sound
   - Return to home or create next receipt

### Phase 2: Android Notification Listening (Pro)

1. **Setup Flow**
   - Pro upgrade prompt mentions auto-detection feature
   - Settings screen: "Enable Payment Auto-Detection"
   - Deep link to Android notification access settings
   - Verify permission granted

2. **Notification Parsing**
   - Listen for notifications from known banking app package names
   - Extract amount from notification text (regex patterns per bank)
   - Match against pending receipts within time window

3. **Smart Matching**
   ```
   Notification: "You received ฿350.00 from PromptPay"
                              ↓
   Check pending receipts from last 30 minutes
                              ↓
   Found: Receipt #123 for ฿350 (created 2 min ago)
                              ↓
   Prompt: "Payment received for Receipt #123?"
              [Yes, Mark Paid]  [No, Different Payment]
   ```

4. **Edge Cases**
   - Multiple pending receipts with same amount → show list to pick from
   - No matching receipt → offer to create new one
   - Amount mismatch → manual confirmation fallback

---

## Technical Requirements

### Dependencies to Add

```json
{
  "expo-android-notification-listener-service": "^x.x.x"
}
```

### Expo Config (app.json)

```json
{
  "expo": {
    "android": {
      "permissions": [
        "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
      ]
    }
  }
}
```

### Development Build Required

This feature requires a custom dev build. Won't work in Expo Go.

```bash
eas build --profile development --platform android
```

---

## Bank Notification Patterns (Thailand)

Examples of notification text to parse:

| Bank | Example Notification |
|------|---------------------|
| KBank | "รับเงิน 500.00 บาท จาก พร้อมเพย์" |
| SCB | "เงินเข้า ฿500.00 PromptPay" |
| Bangkok Bank | "Received THB 500.00 via PromptPay" |
| Krungthai | "รับโอน 500 บาท" |

**Note:** Patterns vary and banks update their apps. Need regex flexibility and periodic updates.

---

## Privacy & Trust Considerations

### User Concerns
- "Why does this app need to read my notifications?"
- Notification access is a sensitive permission

### Mitigations
1. **Clear explanation** during setup: "We only look for bank payment notifications to auto-confirm your sales"
2. **Pro-only feature** - users actively choosing to enable
3. **Filter strictly** - only process notifications from known banking apps
4. **No storage** - don't log or store notification content
5. **Easy disable** - one-tap to turn off in settings

---

## Future Considerations

### If Thai Banks Open Up
- Bank of Thailand is working on open banking regulations
- If personal account APIs become available, integrate directly
- Would replace notification listening approach

### Payment Gateway Option
- Could offer optional Omise/2C2P integration for power users
- Would enable true payment confirmation but adds complexity
- Probably not worth it for street vendor target market

---

## References

- [expo-android-notification-listener-service](https://github.com/SeokyoungYou/expo-android-notification-listener-service)
- [react-native-android-notification-listener](https://github.com/leandrosimoes/react-native-android-notification-listener)
- [Omise PromptPay Docs](https://docs.omise.co/promptpay)
- [SCB Developer Portal](https://developer.scb/)
- [Kasikorn API Portal](https://apiportal.kasikornbank.com/)
- [Bank of Thailand Open Banking](https://www.bot.or.th/)
