# BillSnap Design Options

Pick one direction. I'll apply it to the entire app.

---

## Option A: Emerald Ledger
**Vibe:** Professional finance app. Trust. Money. Thai prosperity.

| Token | Color | Preview |
|-------|-------|---------|
| Primary | `#00A86B` | Emerald green (money/growth) |
| Secondary | `#263238` | Deep charcoal |
| Accent | `#FBC02D` | Gold (prosperity, Thai aesthetic) |
| Background | `#F5F7F8` | Light warm gray |
| Card | `#FFFFFF` | Pure white |
| Text Primary | `#212121` | Near black |
| Text Secondary | `#757575` | Medium gray |
| Paid Status | `#4CAF50` | Green |
| Pending Status | `#FF9800` | Orange |

**Style:**
- Border radius: 12px (rounded)
- Shadows: Subtle
- Typography: Professional (SF Pro / System)

**Best for:** Business owners who want their app to feel like a real accounting tool.

---

## Option B: Aqua Stream
**Vibe:** Clean, minimal, modern. Like a fresh start.

| Token | Color | Preview |
|-------|-------|---------|
| Primary | `#2196F3` | Clean blue |
| Secondary | `#64B5F6` | Light blue |
| Accent | `#00BCD4` | Cyan |
| Background | `#FFFFFF` | Pure white |
| Card | `#F8FAFC` | Barely gray |
| Text Primary | `#1A1A1A` | Rich black |
| Text Secondary | `#6B7280` | Cool gray |
| Paid Status | `#10B981` | Emerald |
| Pending Status | `#F59E0B` | Amber |

**Style:**
- Border radius: 12px (rounded)
- Shadows: Subtle, cool-toned
- Typography: Modern sans (Inter feel)

**Best for:** Users who like Apple-style clean interfaces.

---

## Option C: Vivid Flow (Dark Mode)
**Vibe:** Bold, modern, premium. Stands out.

| Token | Color | Preview |
|-------|-------|---------|
| Primary | `#A78BFA` | Soft purple |
| Secondary | `#34D399` | Teal |
| Accent | `#F472B6` | Pink |
| Background | `#0F172A` | Deep navy |
| Card | `#1E293B` | Slate |
| Text Primary | `#F1F5F9` | Near white |
| Text Secondary | `#94A3B8` | Muted |
| Paid Status | `#4ADE80` | Bright green |
| Pending Status | `#FB923C` | Bright orange |

**Style:**
- Border radius: 16px (very rounded/pill)
- Shadows: Elevated, glowing accents
- Typography: Modern geometric

**Best for:** Users who prefer dark mode and want the app to feel premium/tech-forward.

---

## My Recommendation

**Option A (Emerald Ledger)** - Here's why:

1. **Thai market fit** - Green = money, gold = prosperity. Culturally resonant.
2. **Trust signals** - Finance apps need to feel secure and professional.
3. **Readability** - Light mode is better for outdoor use (Bangkok sun).
4. **Differentiation** - Most apps use blue. Green stands out.

But if you want modern/minimal, go B. If you want bold/different, go C.

---

## What Happens Next

Once you pick:
1. I update `constants/theme.ts` with new colors
2. I update all screens to use the new design tokens consistently
3. I add micro-interactions (active states, transitions)
4. I ensure 48px touch targets everywhere
5. I add skeleton loading states

Pick A, B, or C.
