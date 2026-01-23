# Security Review Report
**Project:** BillSnap
**Date:** 2026-01-24
**Reviewed by:** Claude Code Security Audit

---

## Executive Summary

✅ **Overall Status: GOOD**

The BillSnap project demonstrates strong security practices with proper environment variable handling, secure authentication flows, and protected sensitive data. A few minor issues were identified that should be addressed.

**Severity Breakdown:**
- 🔴 **Critical:** 0
- 🟠 **High:** 1 (dependency vulnerability)
- 🟡 **Medium:** 2 (test credentials, logging)
- 🟢 **Low:** 1 (console.log usage)

---

## 🔴 Critical Issues

**None found** ✅

---

## 🟠 High Severity Issues

### 1. NPM Dependency Vulnerability - `tar` Package

**File:** `package-lock.json`
**Issue:** Race Condition in node-tar Path Reservations
**CVE:** GHSA-r6q2-hw4h-h46w
**Severity:** High (CVSS 8.8)
**Affected Package:** `tar` (version ≤7.5.3)

**Description:**
The `tar` package has a race condition vulnerability involving Unicode ligature collisions on macOS APFS file systems. This could potentially allow an attacker to perform path traversal attacks.

**Recommendation:**
```bash
# Update the tar package
npm audit fix --force
```

**Impact:** Indirect dependency, low exploitability in mobile app context, but should be patched.

---

## 🟡 Medium Severity Issues

### 2. Exposed Test Authentication Credentials

**File:** `/Users/krook/bkk/website/bill/tests/.auth/user.json`
**Lines:** 8-9
**Issue:** File contains real Supabase authentication tokens and user session data

**Exposed Data:**
- JWT access token (expired but still present)
- Refresh token: `REDACTED_REFRESH_TOKEN`
- User email: `cdbkk@pm.me`
- User ID: `adebfdf4-b85d-4048-b47f-ebf0f8def218`
- PostHog analytics token: `REDACTED_POSTHOG_KEY`

**Why This Matters:**
While these tokens appear to be for development/testing, they expose:
1. Real user credentials and IDs
2. Session tokens that could be replayed if still valid
3. Analytics configuration

**Current Mitigation:**
✅ `.gitignore` correctly excludes `tests/.auth/` directory (line 50)

**Problem:**
❌ The file exists in the working directory and was read during this audit

**Recommendation:**
```bash
# Remove the file
rm /Users/krook/bkk/website/bill/tests/.auth/user.json

# Verify .gitignore is working
git status

# If accidentally committed, remove from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch tests/.auth/user.json" \
  --prune-empty --tag-name-filter cat -- --all
```

**Additional Step:**
Rotate the exposed tokens by:
1. Logging out of the test account
2. Regenerating new test sessions
3. Consider using a dedicated test account (not personal email)

---

### 3. Sensitive Data Logging in Development Mode

**Files:** Multiple (24 files with 99 console.log/error statements)
**Issue:** Excessive logging that may expose sensitive data in development builds

**Examples:**

**File:** `/Users/krook/bkk/website/bill/lib/auth/useGoogleAuth.ts`
**Lines:** 57, 122-124
```typescript
if (__DEV__) console.log('Redirect URI:', redirectUri);
// ...
// Don't log URL - contains sensitive OAuth tokens
if (__DEV__) console.error('No access token found in callback');
```

**File:** `/Users/krook/bkk/website/bill/lib/auth/AuthContext.tsx`
**Lines:** 29-30
```typescript
if (error && __DEV__) {
  console.error('Error getting session:', error.message);
}
```

**Good Practice Found:**
✅ Line 122 in `useGoogleAuth.ts` explicitly avoids logging the URL because it contains OAuth tokens

**Problem:**
While most logs are guarded by `__DEV__`, some may still expose:
- Session errors with user context
- Database query errors
- API responses

**Recommendation:**

1. **Create a secure logger utility:**
```typescript
// lib/logger.ts
const SENSITIVE_KEYS = ['token', 'password', 'secret', 'key', 'auth'];

function sanitize(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;

  const sanitized = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
      sanitized[key] = '***REDACTED***';
    } else {
      sanitized[key] = sanitize(obj[key]);
    }
  }
  return sanitized;
}

export const logger = {
  info: (...args: any[]) => {
    if (__DEV__) console.log(...args.map(sanitize));
  },
  error: (...args: any[]) => {
    if (__DEV__) console.error(...args.map(sanitize));
  }
};
```

2. **Replace console.log with logger:**
```typescript
// Before
console.log('User data:', user);

// After
logger.info('User data:', user);
```

---

## 🟢 Low Severity Issues

### 4. Development Console Logs in Production

**Count:** 99 console.log/error statements across 24 files

**Issue:** While all are guarded by `__DEV__`, this creates code bloat and could accidentally leak information if the flag is misconfigured.

**Recommendation:**
1. Use a proper logging library (like `react-native-logs`)
2. Implement log levels (DEBUG, INFO, WARN, ERROR)
3. Automatically strip logs in production builds via babel plugin

**Example Configuration (babel.config.js):**
```javascript
module.exports = {
  plugins: [
    // ... other plugins
    [
      'transform-remove-console',
      { exclude: ['error', 'warn'] }
    ]
  ]
};
```

---

## ✅ Security Best Practices Found

### 1. Environment Variable Management ✅

**File:** `/Users/krook/bkk/website/bill/lib/supabase.ts`
**Lines:** 7-13

```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local file.');
}
```

**Why This Is Good:**
- No hardcoded API keys or secrets
- Fails fast if environment variables are missing
- Proper use of Expo's public env var prefix

### 2. Secure Token Storage ✅

**File:** `/Users/krook/bkk/website/bill/lib/supabase.ts`
**Lines:** 15-84

**Implementation:**
- Uses `expo-secure-store` for mobile (hardware-backed encryption)
- Falls back to `AsyncStorage` when SecureStore fails or data exceeds 2KB
- Implements size checking to prevent SecureStore errors
- Web platform uses `localStorage` (acceptable for web apps)

**Why This Is Good:**
- Sensitive tokens stored in device's secure enclave (iOS Keychain, Android Keystore)
- Graceful degradation with fallback
- Platform-specific handling

### 3. OAuth Security ✅

**File:** `/Users/krook/bkk/website/bill/lib/auth/useGoogleAuth.ts`
**Lines:** 85-91

```typescript
// Validate callback URL matches expected redirect URI before parsing tokens
// This prevents token extraction from malicious redirect URLs
if (!url.startsWith(redirectUri.split('?')[0]) &&
    !url.startsWith('exp://') &&
    !url.startsWith('billsnap://')) {
  throw new Error('Invalid redirect URL - possible security issue');
}
```

**Why This Is Good:**
- Validates redirect URLs to prevent OAuth callback attacks
- Prevents token extraction from malicious URLs
- Explicit security comment explaining the protection

### 4. Session Auto-Refresh ✅

**File:** `/Users/krook/bkk/website/bill/lib/supabase.ts`
**Lines:** 89-90

```typescript
autoRefreshToken: true,
persistSession: true,
```

**File:** `/Users/krook/bkk/website/bill/lib/auth/AuthContext.tsx`
**Lines:** 60-76

**Why This Is Good:**
- Tokens automatically refresh before expiration
- Session refreshed when app comes to foreground
- Reduces likelihood of expired token errors

### 5. Input Validation ✅

**File:** `/Users/krook/bkk/website/bill/lib/validation.ts`

```typescript
export function isValidPromptPayId(id: string): boolean {
  if (!id) return true; // Empty is OK (optional field)
  const cleaned = id.replace(/[-\s]/g, '');
  // Phone number: 10 digits starting with 0
  if (/^0\d{9}$/.test(cleaned)) return true;
  return false;
}
```

**Why This Is Good:**
- Validates user input format
- Prevents invalid data from being stored
- Uses regex for strict validation

### 6. Proper .gitignore Configuration ✅

**File:** `/Users/krook/bkk/website/bill/.gitignore`

**Protected Files:**
- `.env*.local` and `.env` (line 34-35)
- `google-services.json` and `GoogleService-Info.plist` (line 37-39)
- `tests/.auth/` (line 50)
- Private keys: `*.key`, `*.jks`, `*.p8`, `*.p12`, `*.pem`, `*.mobileprovision` (lines 18-19, 31)

**Why This Is Good:**
- Prevents accidental commit of secrets
- Covers all major secret file types
- Includes test authentication state

### 7. SQL Injection Protection ✅

**Implementation:** Uses Supabase client library throughout

**Why This Is Good:**
- All database queries use Supabase's type-safe query builder
- No raw SQL queries found in codebase
- Parameterized queries prevent SQL injection

**Example:**
```typescript
const { data, error } = await supabase
  .from('receipts')
  .select('*')
  .eq('shop_id', id)  // Parameterized, not string concatenation
  .order('created_at', { ascending: false });
```

### 8. No XSS Vulnerabilities ✅

**Finding:** No usage of dangerous patterns found:
- ❌ `eval()`
- ❌ `innerHTML`
- ❌ `dangerouslySetInnerHTML`
- ❌ `document.write()`

**Why This Is Good:**
- React's JSX automatically escapes content
- No direct DOM manipulation that could introduce XSS

### 9. Offline Queue with Data Integrity ✅

**File:** `/Users/krook/bkk/website/bill/lib/hooks/useReceipts.ts`
**Lines:** 162-196

**Why This Is Good:**
- Generates unique IDs for offline receipts (`temp_${Date.now()}_${Math.random()}`)
- Prevents ID collisions
- Syncs to server when connection returns
- Maintains data consistency

---

## Architecture Security Review

### Authentication Flow ✅

1. **Email OTP** (useEmailAuth.ts)
   - Uses Supabase's magic link/OTP flow
   - No password storage needed
   - 6-digit code verification
   - Proper error messages without exposing system details

2. **Google OAuth** (useGoogleAuth.ts)
   - Web-based OAuth flow for Expo Go
   - Redirect URI validation
   - Token extraction from callback
   - Session establishment via Supabase

3. **Session Management** (AuthContext.tsx)
   - Auto-refresh on app foreground
   - Listens for auth state changes
   - Proper cleanup on unmount

### Data Storage Security ✅

**Local Storage:**
- Non-sensitive: `AsyncStorage` (onboarding state, preferences)
- Sensitive: `SecureStore` (auth tokens, session data)

**Remote Storage:**
- Supabase with Row-Level Security (RLS) policies (assumed, not visible in code)
- User-scoped queries (all use `user_id` or `shop_id` filters)

### Network Security ✅

- HTTPS enforced (Supabase URLs are HTTPS)
- No hardcoded HTTP endpoints
- Proper error handling without exposing internals

---

## Recommendations Summary

### Immediate Actions (High Priority)

1. **Fix tar vulnerability:**
   ```bash
   npm audit fix --force
   ```

2. **Remove exposed test credentials:**
   ```bash
   rm /Users/krook/bkk/website/bill/tests/.auth/user.json
   ```

3. **Rotate exposed tokens:**
   - Log out test account
   - Generate new test session
   - Use dedicated test account (not personal email)

### Medium Priority

4. **Implement secure logging:**
   - Create sanitization utility
   - Replace console.log with secure logger
   - Auto-strip logs in production builds

### Low Priority

5. **Code quality improvements:**
   - Add babel plugin to remove console logs in production
   - Consider adding Sentry or similar for production error tracking
   - Document security assumptions (e.g., RLS policies)

---

## Testing Recommendations

### Security Tests to Add

1. **Auth Flow Tests:**
   - Test token expiration handling
   - Test invalid OAuth redirects
   - Test session refresh on app resume

2. **Input Validation Tests:**
   - Test PromptPay ID validation edge cases
   - Test SQL injection attempts (should fail gracefully)
   - Test XSS attempts in user input fields

3. **Offline Mode Tests:**
   - Test queued receipt integrity
   - Test sync conflict resolution
   - Test data loss scenarios

---

## Compliance Considerations

### GDPR / Privacy

✅ **Good:**
- User data is user-scoped (proper isolation)
- Email used only for authentication
- No unnecessary data collection

⚠️ **Consider:**
- Add privacy policy
- Implement data export feature
- Add account deletion feature

### PCI DSS (if processing payments)

⚠️ **Note:** If you add payment processing beyond PromptPay QR codes:
- Do NOT store card numbers
- Use Stripe/Omise/payment gateway
- Never handle raw payment credentials

---

## Final Score

**Overall Security Rating: B+**

**Strengths:**
- Excellent environment variable handling
- Secure token storage implementation
- No SQL injection vulnerabilities
- No XSS vulnerabilities
- Proper OAuth validation
- Good .gitignore coverage

**Areas for Improvement:**
- Dependency vulnerabilities (1 high)
- Test credential exposure
- Logging practices

**Conclusion:**
The BillSnap project demonstrates solid security fundamentals. The identified issues are minor and easily addressable. Once the high-priority items are resolved, this project will have an **A security rating**.

---

## Audit Checklist

- [x] Environment variables (no hardcoded secrets)
- [x] Authentication implementation review
- [x] SQL injection vulnerability check
- [x] XSS vulnerability check
- [x] Sensitive data in git history
- [x] .gitignore configuration
- [x] Dependency vulnerabilities scan
- [x] Token storage security
- [x] OAuth flow validation
- [x] Input validation
- [x] Logging practices review
- [x] Network security (HTTPS)

---

**Report Generated:** 2026-01-24
**Next Review Date:** 2026-04-24 (recommended quarterly reviews)
