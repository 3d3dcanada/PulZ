# Operator Boundary System

## Overview

The PulZ operator boundary is a global, non-bypassable layer that ensures all operators acknowledge their entry into the system before accessing any content.

**This is not authentication. This is operator awareness.**

## Architecture

### Layer 1: Keyring (Single Source of Truth)

Location: `/src/config/keyring.ts`

The keyring is the canonical access state for the entire PulZ system. All components must check this keyring before allowing access.

**Key Functions:**
- `getOperatorState()`: Get the current operator state
- `checkAccess()`: Check if operator has valid access
- `grantAccess()`: Grant access (acknowledgment)
- `revokeAccess()`: Revoke access (clear acknowledgment)
- `clearKeyring()`: Clear all keyring data

**State Structure:**
```typescript
interface OperatorState {
  acknowledged: boolean          // Has the operator acknowledged entry?
  acknowledgedAt: string | null   // When was acknowledgment granted?
  expiresAt: string | null       // When does acknowledgment expire?
  sessionId: string | null       // Unique session ID
}
```

**Why This Matters:**
- Single source of truth eliminates duplication
- No component can invent its own access logic
- Revocable by clearing the keyring
- Time-bounded (8 hours default, 7 days with "remember me")

### Layer 2: Global Boundary (Layout Level)

Location: `/src/components/OperatorBoundary.tsx`

The boundary is enforced at the highest possible architectural level—the layout. This ensures:

1. **Nothing renders behind it** - The layout wraps all content
2. **No page loads behind it** - Children don't render until authorized
3. **No direct URL bypasses it** - Router checks happen before page rendering
4. **No header link bypasses it** - Navigation is inside the boundary

**Implementation:**
```tsx
<OperatorBoundary>
  <Navigation />
  <main className="min-h-screen">
    {children}
  </main>
</OperatorBoundary>
```

### Layer 3: Lobby UI

Location: `/src/components/Lobby.tsx`

The lobby replaces the old passcode-only gate with a clear, educational interface.

**Sections:**
- **What is this gate?** - "An operator acknowledgment boundary for a live demo environment."
- **What is PulZ?** - "A governed operating layer for company decisions and systems."
- **What is it NOT?** - Not security, not authentication, not a login form
- **Why does it exist?** - "To prevent silent operation and ensure human awareness."
- **What happens if I proceed?** - "You are entering a simulated control environment."

**Design Principles:**
- Calm, confident tone
- No jargon
- No hashes or IDs without explanation
- Icons and visual hierarchy
- Expandable sections for detailed information
- A mechanic should feel comfortable, not tested

### Layer 4: Navigation Discipline

**Before Access:**
- Navigation is hidden (doesn't render)
- Links don't exist (nothing to click)
- No ghost interactions

**After Access:**
- Everything works normally
- No friction
- No repeated prompts

This is about psychological safety, not just logic.

### Layer 5: Learning System Integration

Location: `/src/learning/incidentLog.ts`

The incident "Operator boundary bypass via direct navigation" (INC-2025-002) is formally recorded with:

1. **What happened:** Access gate was only on root page, navigation and deep links bypassed it
2. **Why it happened:** Page-specific access control instead of system-wide
3. **Why it was dangerous:** Silent operation, lack of operator awareness
4. **Structural change:** Global boundary at layout level with keyring as single source of truth
5. **Verification:** All URLs now redirect to lobby until acknowledgment

## Why the Old Model Failed

### Problem 1: Page-Specific Access Control
```tsx
// OLD: Only protects page.tsx
// /app/page.tsx
if (!isAuthorized) {
  return <AccessGate onAuthorized={() => setIsAuthorized(true)} />
}
```

**Issue:** Other pages (`/entry`, `/learning`, `/settings`) had no access control.

### Problem 2: Accessible Navigation
```tsx
// OLD: Navigation always renders
// /app/layout.tsx
<Navigation />
<main>
  {children}
</main>
```

**Issue:** Navigation links were clickable even without authorization.

### Problem 3: Direct URL Bypass
```tsx
// OLD: No check on navigation
// Visiting /learning directly shows full UI
```

**Issue:** Deep links completely bypassed the access gate.

### Problem 4: No Educational Context
```tsx
// OLD: Just a passcode form
<input type="password" placeholder="Enter access passcode" />
```

**Issue:** Operators didn't understand what they were entering or why.

## Why This Model Cannot Fail

### 1. Architectural Enforceability

The boundary is at the layout level—the highest possible point in the component tree.

```
RootLayout
  └─ OperatorBoundary (enforces here)
      ├─ Navigation (only renders if authorized)
      └─ main (only renders if authorized)
          └─ children (all pages protected)
```

**Impossible to bypass because:**
- Layout wraps everything
- No child renders until authorized
- Router checks happen at boundary level
- Even deep links hit the boundary first

### 2. Single Source of Truth

The keyring (`/src/config/keyring.ts`) is the only place that stores access state.

```typescript
// No page or component has its own logic
// All must call:
import { checkAccess } from '@/config/keyring'

if (checkAccess()) {
  // show content
}
```

**Impossible to bypass because:**
- No component invents its own logic
- Keyring is the authority
- Clearing keyring revokes all access everywhere

### 3. Time-Bounded Sessions

Access expires automatically:

```typescript
const now = Date.now()
const expires = new Date(state.expiresAt).getTime()

if (now >= expires) {
  // Clear expired session
  clearKeyring()
}
```

**Impossible to bypass because:**
- Expired sessions are invalid
- Cannot extend without re-acknowledgment
- Storage is cleared on expiration

### 4. Explicit Acknowledgment

The lobby clearly states what's happening:

```
"I Understand. Enter System."
```

Not "Login" or "Sign in"—operators are **acknowledging** they understand where they are.

**Impossible to bypass because:**
- Passcode is still required
- Acknowledgment is explicit
- Terms are clear before entry

## Security Honesty

**This is client-side only. It is not real security.**

A knowledgeable user can:
- Modify the keyring in browser dev tools
- Disable JavaScript entirely
- Directly access HTML from the static export

**This is intentional.**

The boundary serves to:
1. Ensure human awareness
2. Prevent silent operation
3. Set expectations before entry
4. Demonstrate the concept (not implement production auth)

For production deployment, upgrade to:
- Netlify Functions + JWT
- Supabase Auth
- Cloudflare Access
- Or any server-side authentication

## Testing the Boundary

### Acceptance Tests

1. **Brand-new Incognito session:**
   - Visit `/entry` → shows Lobby ✓
   - Visit `/learning` → shows Lobby ✓
   - Visit `/settings` → shows Lobby ✓
   - Clicking header → header doesn't render ✓

2. **After acknowledgment:**
   - Enter passcode → system unlocks ✓
   - Visit any page → full system access ✓
   - Navigation works normally ✓

3. **Clearing storage:**
   - Clear localStorage/sessionStorage ✓
   - Refresh page → returns to Lobby ✓

### Manual Testing

```bash
# Test with fresh session (Incognito mode)
npm run dev

# Test storage clearing
# In DevTools console:
localStorage.clear()
sessionStorage.clear()
# Then refresh
```

## Migration from Old System

### Files Deleted/Deprecated:
- `AccessGate.tsx` - Replaced by `Lobby.tsx`
- Old page-based access control - Replaced by layout-level boundary

### Files Created:
- `keyring.ts` - Single source of access truth
- `Lobby.tsx` - Educational operator interface
- `OperatorBoundary.tsx` - Global boundary enforcement

### Files Modified:
- `layout.tsx` - Added OperatorBoundary wrapper
- `page.tsx` - Simplified to just redirect to /entry
- `incidentLog.ts` - Added INC-2025-002

### Access Control Config:
- `access.ts` - Still used for passcode verification
- Can be upgraded to server-side auth later

## Future Layers (After 2.2)

Once the operator boundary is solid, the next layers will build on this foundation:

1. **Library Layer** - Explainable knowledge, case studies, failures & learnings
2. **Tool Repository** - What tools exist, what they do, when to use them
3. **Kernel / Brain** - Decisions, evidence, confidence, audit trails

Each layer will:
- Be finished and understandable
- Be operator-first
- Respect the boundary
- Demonstrate governance by structure

## Summary

The operator boundary is the spine of the PulZ system. It ensures:

✅ Single source of access truth (keyring)
✅ Global boundary enforcement (layout level)
✅ Educational lobby UI (explains itself)
✅ Navigation discipline (no confusion)
✅ Learning system integration (records mistakes)

This is not about stopping people. It's about making sure everyone knows where they are.
