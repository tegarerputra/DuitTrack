# 📋 Comprehensive Implementation Plan: Tracking Cycle Terminology & Onboarding Flow

## 🎯 Overview

**Document Version:** 1.0
**Date:** October 1, 2025
**Status:** ✅ Ready for Implementation
**Author:** DuitTrack Development Team

### **Objectives**

1. **Terminology Migration:** Replace "Budget Period" with "Tracking Period" / "Periode Tracking" throughout the application
2. **Firebase Error Fixes:** Resolve undefined field errors in user profile creation
3. **Onboarding Enhancement:** Implement Step 2.5 budget setup choice architecture
4. **Dashboard Integration:** Add budget setup CTA card for users who skipped setup

### **Rationale**

**Why "Tracking Period"?**
- Generic and flexible - works with or without budget
- Not dependent on budget setup completion
- Clear purpose: tracking expenses in periods
- Professional fintech terminology
- Works well in both English and Indonesian

---

## 📁 I. Terminology Migration

### **Current State Analysis**

**Files Affected:** 8 files contain "Budget Period" references

1. `src/routes/onboarding/+page.svelte`
2. `src/lib/utils/periodHelpers.ts`
3. `src/lib/types/index.ts`
4. `src/routes/dashboard/+page.svelte`
5. `src/routes/settings/+page.svelte`
6. `src/routes/expenses/+page.svelte`
7. `src/lib/components/budget/Budget.svelte`
8. `src/routes/test-period/+page.svelte`

### **Terminology Mapping**

| Old Term | New Term (EN) | New Term (ID) | Context |
|----------|---------------|---------------|---------|
| Budget Period | Tracking Period | Periode Tracking | General UI |
| Budget Reset Date | Period Reset Date | Tanggal Reset Periode | Settings |
| Period Preview | Period Preview | Preview Periode | Onboarding |
| Current Period | Current Period | Periode Saat Ini | Dashboard |
| Next Period | Next Period | Periode Berikutnya | Calendar |
| Reset setiap: | Reset setiap: | Reset setiap: | Info display |

### **Code Variable Naming Conventions**

**Keep These (for consistency):**
```typescript
// Internal code variables (no need to change)
budgetResetDate    // Keep as is
budgetResetType    // Keep as is
hasBudgetSetup     // Keep as is
```

**Optional Renames (for clarity):**
```typescript
// Variables can stay as-is since they already use "period" terminology
currentPeriod → currentPeriod (no change needed)
generatePeriods() → generatePeriods() (no change needed)
periodPreview → periodPreview (no change needed)
```

**Recommendation:** Keep code variable names as-is for now to avoid breaking changes. Only update UI-facing strings.

### **String Replacement Guide**

**Search & Replace Operations:**

```bash
# Onboarding page
"Budget Period" → "Tracking Period"
"budget period" → "tracking period"
"Kapan Budget Period" → "Kapan Tracking Period"

# Dashboard
"Period saat ini" → "Periode saat ini"
"Budget reset" → "Reset periode"

# Comments (optional)
"// Budget period" → "// Tracking period"
```

---

## 🐛 II. Firebase Error Fixes

### **Error Analysis**

**Primary Error:**
```
Error: Function setDoc() called with invalid data.
Unsupported field value: undefined (found in field nickname in document users/...)
```

**Root Causes:**

1. **Empty nickname field** - When user doesn't enter nickname, we pass `undefined` to Firebase
2. **Missing preferences object** - UserProfile schema expects `preferences` but we don't provide it
3. **No field validation** - We don't clean data before sending to Firestore

### **Solution 1: Handle Empty Nickname**

**Before (causes error):**
```typescript
const result = await authService.completeOnboarding({
  nickname: nickname.trim() || undefined, // ❌ undefined causes error
  // ...
});
```

**After (fixed):**
```typescript
const profileData = {
  onboardingComplete: true,
  ...(nickname.trim() && { nickname: nickname.trim() }), // ✅ Only add if not empty
  currency: 'IDR',
  locale: 'id-ID',
  // ...
};
```

### **Solution 2: Add Default Preferences**

**Create Default Preferences Constant:**

```typescript
// In src/routes/onboarding/+page.svelte
const defaultPreferences: UserPreferences = {
  theme: 'system',
  notifications: {
    email: false,
    push: false,
    budgetAlerts: true,
    weeklyReports: false,
    monthlyReports: false
  },
  budgetWarnings: true,
  monthlyReports: false,
  currency: 'IDR',
  dateFormat: 'DD/MM/YYYY'
};
```

### **Solution 3: Clean Profile Data Function**

**Helper Function:**

```typescript
function cleanProfileData(data: Partial<UserProfile>): any {
  const cleaned: any = {};

  Object.entries(data).forEach(([key, value]) => {
    // Only include fields that are not undefined or null
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  });

  return cleaned;
}
```

**Usage:**

```typescript
async function completeOnboarding() {
  const rawData = {
    onboardingComplete: true,
    ...(nickname.trim() && { nickname: nickname.trim() }),
    currency: 'IDR',
    locale: 'id-ID',
    budgetResetDate: resetType === 'last-day-of-month' ? -1 : selectedResetDate,
    budgetResetType: resetType,
    hasBudgetSetup: false,
    preferences: defaultPreferences
  };

  const cleanData = cleanProfileData(rawData);
  const result = await authService.completeOnboarding(cleanData);

  // ...
}
```

---

## ✨ III. Onboarding Flow Enhancement

### **New Flow Architecture**

```
┌─────────────────────────────────────────────────┐
│  Step 1: Welcome + Nickname                     │
│  - User sees personalized greeting               │
│  - Optional nickname input                       │
│  - Continue to Step 2                           │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  Step 2: Tracking Period Setup                  │
│  - Select reset date (1, 25, end-of-month, etc) │
│  - Preview upcoming periods                      │
│  - Continue to Step 2.5                         │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  Step 2.5: Budget Setup Choice (NEW)            │
│  ┌───────────────────────────────────────────┐  │
│  │  ✅ Tracking Period Tersimpan!           │  │
│  │                                           │  │
│  │  Reset setiap: Tanggal 25                │  │
│  │  Periode saat ini: 25 Okt - 24 Nov       │  │
│  ├───────────────────────────────────────────┤  │
│  │  Mau lanjut setup budget sekarang?       │  │
│  │  Dengan setup budget, kamu bisa kontrol  │  │
│  │  pengeluaran lebih baik                  │  │
│  │                                           │  │
│  │  [🎯 Setup Budget Sekarang]              │  │
│  │  [⏭️ Nanti aja, ke Dashboard]            │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
           ↓                    ↓
    Setup Budget           Skip to Dashboard
           ↓                    ↓
    ┌──────────────┐      ┌──────────────┐
    │ Save data    │      │ Save data    │
    │ Confetti 🎉  │      │ Confetti 🎉  │
    │ Toast msg    │      │ Toast msg    │
    │ → /budget    │      │ → /dashboard │
    └──────────────┘      └──────────────┘
```

### **Implementation: Budget Choice Modal**

**Component Structure:**

```svelte
<!-- In src/routes/onboarding/+page.svelte -->

<script lang="ts">
  // Add to existing state
  let showBudgetChoice = false;

  // ... existing code ...

  // Modify the completeOnboarding button handler
  async function onTrackingPeriodComplete() {
    // Instead of completing directly, show choice modal
    showBudgetChoice = true;
  }

  // New handler: Setup budget path
  async function setupBudgetNow() {
    showBudgetChoice = false;
    isCompleting = true;

    try {
      // Save tracking period data
      const result = await saveTrackingPeriod();

      if (result.success) {
        // Celebrate!
        celebrateSuccess();

        // Show success toast
        toast.success('Oke! Mari setup budget kamu 🎯', {
          duration: 2000,
          position: 'top-center',
        });

        // Redirect to budget page with context
        setTimeout(() => {
          goto('/budget?fromOnboarding=true&setupTracking=true');
        }, 1000);
      } else {
        toast.error('Gagal menyimpan. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      isCompleting = false;
    }
  }

  // New handler: Skip to dashboard
  async function skipToDashboard() {
    showBudgetChoice = false;
    isCompleting = true;

    try {
      // Save tracking period data
      const result = await saveTrackingPeriod();

      if (result.success) {
        // Celebrate!
        celebrateSuccess();

        // Show reminder toast
        toast.success('Akun siap! Setup budget nanti ya 😊', {
          duration: 3000,
          position: 'top-center',
        });

        // Redirect to dashboard
        setTimeout(() => {
          goto('/dashboard');
        }, 1500);
      } else {
        toast.error('Gagal menyimpan. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      isCompleting = false;
    }
  }

  // Shared save function
  async function saveTrackingPeriod() {
    const defaultPreferences = {
      theme: 'system',
      notifications: {
        email: false,
        push: false,
        budgetAlerts: true,
        weeklyReports: false,
        monthlyReports: false
      },
      budgetWarnings: true,
      monthlyReports: false,
      currency: 'IDR',
      dateFormat: 'DD/MM/YYYY'
    };

    const profileData = {
      onboardingComplete: true,
      ...(nickname.trim() && { nickname: nickname.trim() }),
      currency: 'IDR',
      locale: 'id-ID',
      budgetResetDate: resetType === 'last-day-of-month' ? -1 : selectedResetDate,
      budgetResetType: resetType,
      hasBudgetSetup: false,
      preferences: defaultPreferences
    };

    const cleanData = cleanProfileData(profileData);
    return await authService.completeOnboarding(cleanData);
  }

  function cleanProfileData(data: any): any {
    const cleaned: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
</script>

<!-- Budget Choice Modal -->
{#if showBudgetChoice}
  <div class="budget-choice-overlay" transition:fade={{ duration: 200 }}>
    <div class="budget-choice-card" transition:fly={{ y: 20, duration: 400 }}>
      <!-- Success Indicator -->
      <div class="choice-success-icon">✅</div>
      <h3 class="choice-title">Tracking Period Tersimpan!</h3>
      <p class="choice-info">
        Reset setiap:
        {#if resetType === 'last-day-of-month'}
          Akhir bulan
        {:else}
          Tanggal {selectedResetDate}
        {/if}
      </p>

      {#if currentPeriod}
        <p class="choice-period">
          Periode saat ini: {formatPeriodDisplay(currentPeriod.startDate, currentPeriod.endDate)}
        </p>
      {/if}

      <div class="choice-divider"></div>

      <!-- Budget Setup Prompt -->
      <h4 class="choice-question">Mau lanjut setup budget sekarang?</h4>
      <p class="choice-subtitle">
        Dengan setup budget, kamu bisa kontrol pengeluaran lebih baik
      </p>

      <!-- Action Buttons -->
      <button
        class="primary-button w-full mb-3"
        on:click={setupBudgetNow}
        disabled={isCompleting}
      >
        <span class="button-content">
          <span class="button-icon">🎯</span>
          <span class="button-text">Setup Budget Sekarang</span>
        </span>
        <div class="button-glow"></div>
      </button>

      <button
        class="secondary-button w-full"
        on:click={skipToDashboard}
        disabled={isCompleting}
      >
        <span class="button-content">
          <span class="button-icon">⏭️</span>
          <span class="button-text">Nanti aja, ke Dashboard</span>
        </span>
      </button>
    </div>
  </div>
{/if}
```

### **CSS Styling for Budget Choice Modal**

```css
/* Budget Choice Modal */
.budget-choice-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.budget-choice-card {
  max-width: 480px;
  width: 100%;
  padding: 32px;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 252, 255, 0.9) 100%);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.choice-success-icon {
  font-size: 64px;
  text-align: center;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 8px rgba(16, 185, 129, 0.3));
}

.choice-title {
  font-size: 24px;
  font-weight: 800;
  color: #1f2937;
  text-align: center;
  margin-bottom: 8px;
}

.choice-info {
  font-size: 15px;
  font-weight: 600;
  color: #0891B2;
  text-align: center;
  margin-bottom: 4px;
}

.choice-period {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  margin-bottom: 20px;
}

.choice-divider {
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(6, 182, 212, 0.2),
    transparent);
  margin: 20px 0;
}

.choice-question {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  margin-bottom: 8px;
}

.choice-subtitle {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  line-height: 1.5;
  margin-bottom: 24px;
}

/* Button content with icon */
.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.button-icon {
  font-size: 18px;
}
```

### **Update Step 2 "Lanjut ke Dashboard" Button**

**Replace the existing completeOnboarding handler:**

```svelte
<!-- Before -->
<button
  class="primary-button flex-1"
  on:click={completeOnboarding}
  disabled={isCompleting}
>
  Lanjut ke Dashboard
</button>

<!-- After -->
<button
  class="primary-button flex-1"
  on:click={onTrackingPeriodComplete}
  disabled={isCompleting}
>
  Lanjut
</button>
```

---

## 📊 IV. Dashboard Integration

### **Budget Setup CTA Card**

**Component Implementation:**

```svelte
<!-- In src/routes/dashboard/+page.svelte -->

<script lang="ts">
  // Add to existing code
  import { userProfileStore } from '$stores/auth';
  import { goto } from '$app/navigation';

  // Reactive statement
  $: hasBudgetSetup = $userProfileStore?.hasBudgetSetup ?? false;
</script>

<!-- Add after AuthGuard, before main dashboard content -->
<AuthGuard requireAuth={true} redirectTo="/" let:user>

  <!-- Budget Setup CTA Card (shown when no budget setup) -->
  {#if !hasBudgetSetup}
    <div class="budget-cta-card" transition:fly={{ y: 20, duration: 400 }}>
      <div class="cta-icon">🎯</div>
      <div class="cta-content">
        <h3 class="cta-title">Setup Budget Yuk!</h3>
        <p class="cta-description">
          Kelola keuangan lebih baik dengan budget untuk setiap periode tracking
        </p>
      </div>
      <button
        class="cta-button"
        on:click={() => goto('/budget?setupPrompt=dashboard')}
      >
        Setup Sekarang
      </button>
    </div>
  {/if}

  <!-- Rest of dashboard content -->
  <!-- ... -->

</AuthGuard>
```

### **CSS Styling for CTA Card**

```css
/* Budget Setup CTA Card */
.budget-cta-card {
  padding: 20px;
  margin: 16px 0 20px;
  background: linear-gradient(135deg,
    rgba(245, 158, 11, 0.1) 0%,
    rgba(249, 115, 22, 0.08) 100%);
  border: 2px solid rgba(245, 158, 11, 0.3);
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
  transition: all 0.3s ease;
}

.budget-cta-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.2);
}

.cta-icon {
  font-size: 40px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.cta-content {
  flex: 1;
}

.cta-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.cta-description {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.cta-button {
  padding: 10px 20px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: white;
  font-weight: 700;
  font-size: 14px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

/* Mobile responsive */
@media (max-width: 640px) {
  .budget-cta-card {
    flex-direction: column;
    text-align: center;
    padding: 24px 16px;
  }

  .cta-button {
    width: 100%;
  }
}
```

### **Conditional Logic**

**The CTA card should show when:**
- User has completed onboarding (`onboardingComplete: true`)
- User has NOT setup budget (`hasBudgetSetup: false`)

**The CTA card should hide when:**
- User has setup budget (`hasBudgetSetup: true`)
- User is in onboarding flow
- User explicitly dismissed it (optional feature)

---

## 📋 V. Implementation Checklist

### **Phase 1: Terminology Migration** ⏱️ 2-3 hours

- [ ] **Create terminology constants** (optional)
  - Create `src/lib/constants/terminology.ts`
  - Define TRACKING_PERIOD constants

- [ ] **Update onboarding page**
  - Replace "Budget Period" → "Tracking Period"
  - Update step title
  - Update preview labels

- [ ] **Update dashboard**
  - Replace period display strings
  - Update period info display

- [ ] **Update settings page**
  - Update reset date section
  - Update help text

- [ ] **Update expenses page**
  - Update period filter labels

- [ ] **Update budget component**
  - Update period references in UI

- [ ] **Update periodHelpers**
  - Update function comments
  - Update return string values (if any)

- [ ] **Update types documentation**
  - Update comments in index.ts

### **Phase 2: Firebase Error Fixes** ⏱️ 1 hour

- [ ] **Create helper functions**
  - Add `cleanProfileData()` function
  - Add `defaultPreferences` constant

- [ ] **Update onboarding save logic**
  - Implement conditional nickname spread
  - Add preferences object
  - Use cleanProfileData before save

- [ ] **Test empty nickname**
  - Complete onboarding without nickname
  - Verify no Firebase errors
  - Check Firestore data structure

- [ ] **Test with existing data**
  - Verify backward compatibility
  - Check user profile reads correctly

### **Phase 3: Onboarding Flow** ⏱️ 3-4 hours

- [ ] **Add state management**
  - Add `showBudgetChoice` state
  - Add `isCompleting` protection

- [ ] **Create budget choice modal**
  - Build modal component structure
  - Add success indicator
  - Add cycle info display
  - Add two action buttons

- [ ] **Implement handlers**
  - Create `onTrackingCycleComplete()`
  - Create `setupBudgetNow()`
  - Create `skipToDashboard()`
  - Create `saveTrackingCycle()`

- [ ] **Update existing buttons**
  - Change "Lanjut ke Dashboard" → "Lanjut"
  - Update click handler to show modal

- [ ] **Add styling**
  - Style modal overlay
  - Style modal card
  - Add animations/transitions
  - Ensure mobile responsive

- [ ] **Test both paths**
  - Test "Setup Budget" flow
  - Test "Skip to Dashboard" flow
  - Verify confetti triggers
  - Verify toast messages
  - Verify routing

### **Phase 4: Dashboard Integration** ⏱️ 2 hours

- [ ] **Create CTA card component**
  - Build card structure
  - Add icon, title, description
  - Add action button

- [ ] **Add conditional logic**
  - Check `hasBudgetSetup` status
  - Show/hide based on status

- [ ] **Style CTA card**
  - Match design system
  - Add hover effects
  - Ensure mobile responsive

- [ ] **Implement click handler**
  - Navigate to `/budget`
  - Pass URL params for context

- [ ] **Test behavior**
  - Verify shows when should
  - Verify hides when should
  - Test click navigation

### **Phase 5: Testing & Polish** ⏱️ 2 hours

- [ ] **End-to-end testing**
  - Complete full onboarding flow
  - Test both setup/skip paths
  - Verify data saves correctly

- [ ] **Firebase testing**
  - Check Firestore data structure
  - Verify no undefined errors
  - Test with empty nickname

- [ ] **UI/UX testing**
  - Check animations smooth
  - Verify toast messages clear
  - Test modal responsiveness

- [ ] **Mobile testing**
  - Test on actual device
  - Check touch interactions
  - Verify responsive layouts

- [ ] **Cross-browser testing**
  - Chrome, Firefox, Safari
  - Check confetti works
  - Verify styles consistent

- [ ] **Performance check**
  - Measure page load times
  - Check bundle size impact
  - Optimize if needed

---

## 📄 VI. File Modification List

### **Core Files (Must Modify)**

#### **1. `src/routes/onboarding/+page.svelte`**

**Changes:**
- Replace "Budget Period" → "Tracking Period" in UI strings
- Add `showBudgetChoice` state
- Add budget choice modal component
- Create `saveTrackingPeriod()` function
- Create `setupBudgetNow()` handler
- Create `skipToDashboard()` handler
- Add `cleanProfileData()` helper
- Add `defaultPreferences` constant
- Update button handler to show modal instead of direct complete

**Lines to modify:** ~50-100 lines
**Estimated time:** 2-3 hours

---

#### **2. `src/lib/services/authService.ts`**

**Changes:**
- Already using `setDoc` with merge ✅ (completed)
- Optionally add field validation
- Ensure handles undefined values gracefully

**Lines to modify:** ~5-10 lines
**Estimated time:** 30 minutes

---

#### **3. `src/lib/types/index.ts`**

**Changes:**
- Update comments: "Budget period" → "Tracking period"
- Ensure `UserPreferences` interface is complete
- Verify all fields have proper types

**Lines to modify:** ~10-15 lines (comments mostly)
**Estimated time:** 15 minutes

---

#### **4. `src/routes/dashboard/+page.svelte`**

**Changes:**
- Replace "Budget Period" → "Tracking Period" terminology
- Add budget CTA card component
- Add conditional rendering logic
- Handle URL params from onboarding
- Add CTA click handler

**Lines to modify:** ~30-50 lines
**Estimated time:** 1-2 hours

---

#### **5. `src/lib/utils/periodHelpers.ts`**

**Changes:**
- Update function comments
- Update any string return values
- Keep function names as-is (optional)

**Lines to modify:** ~10-20 lines (mostly comments)
**Estimated time:** 30 minutes

---

### **Secondary Files (Recommended)**

#### **6. `src/routes/settings/+page.svelte`**

**Changes:**
- Update "Budget Period" → "Tracking Period" in settings UI
- Update help text and labels

**Lines to modify:** ~10-20 lines
**Estimated time:** 30 minutes

---

#### **7. `src/routes/expenses/+page.svelte`**

**Changes:**
- Update period display labels
- Update filter UI text

**Lines to modify:** ~5-10 lines
**Estimated time:** 15 minutes

---

#### **8. `src/lib/components/budget/Budget.svelte`**

**Changes:**
- Update period reference strings
- Update UI labels

**Lines to modify:** ~10-15 lines
**Estimated time:** 30 minutes

---

#### **9. `src/routes/test-period/+page.svelte`**

**Changes:**
- Update test page labels
- Update period display

**Lines to modify:** ~5-10 lines
**Estimated time:** 15 minutes

---

### **New File (Optional)**

#### **10. `src/lib/constants/terminology.ts`**

**Purpose:** Centralize terminology for easy future updates

**Content:**
```typescript
/**
 * Centralized terminology for DuitTrack
 * Allows easy updates to UI strings across the app
 */
export const TERMINOLOGY = {
  // Tracking Period
  TRACKING_PERIOD: 'Tracking Period',
  TRACKING_PERIOD_ID: 'Periode Tracking',
  PERIODE_TRACKING: 'Periode Tracking',

  // Reset
  PERIOD_RESET: 'Period Reset',
  RESET_PERIODE: 'Reset Periode',

  // Current/Next
  CURRENT_PERIOD: 'Current Period',
  PERIODE_SAAT_INI: 'Periode Saat Ini',
  NEXT_PERIOD: 'Next Period',
  PERIODE_BERIKUTNYA: 'Periode Berikutnya',

  // Setup
  SETUP_PERIOD: 'Setup Tracking Period',
  SETUP_PERIODE: 'Setup Periode Tracking'
} as const;

export type TerminologyKey = keyof typeof TERMINOLOGY;
```

**Usage:**
```typescript
import { TERMINOLOGY } from '$lib/constants/terminology';

<h2>{TERMINOLOGY.TRACKING_PERIOD_ID}</h2>
```

**Estimated time:** 30 minutes

---

## 🧪 VII. Testing Scenarios

### **Test Case 1: New User - Setup Budget Path**

**Steps:**
1. Navigate to `/onboarding`
2. Enter nickname: "TestUser" (or leave empty)
3. Click "Yuk Mulai!"
4. Select tracking period: "Tanggal 25"
5. Click "Lanjut"
6. Modal appears: "Tracking Period Tersimpan!"
7. Click "🎯 Setup Budget Sekarang"

**Expected Results:**
- ✅ Confetti animation plays
- ✅ Toast message: "Oke! Mari setup budget kamu 🎯"
- ✅ Redirects to `/budget?fromOnboarding=true&setupTracking=true`
- ✅ No Firebase errors in console
- ✅ Firestore has correct data:
  ```json
  {
    "onboardingComplete": true,
    "nickname": "TestUser",
    "budgetResetDate": 25,
    "budgetResetType": "fixed",
    "hasBudgetSetup": false,
    "preferences": { /* default prefs */ }
  }
  ```

---

### **Test Case 2: New User - Skip Budget Path**

**Steps:**
1. Navigate to `/onboarding`
2. Enter nickname (or leave empty)
3. Select tracking period: "Akhir bulan"
4. Click "Lanjut"
5. Modal appears
6. Click "⏭️ Nanti aja, ke Dashboard"

**Expected Results:**
- ✅ Confetti animation plays
- ✅ Toast message: "Akun siap! Setup budget nanti ya 😊"
- ✅ Redirects to `/dashboard`
- ✅ Dashboard shows budget CTA card
- ✅ No Firebase errors
- ✅ Firestore: `hasBudgetSetup: false`

---

### **Test Case 3: Empty Nickname Handling**

**Steps:**
1. Navigate to `/onboarding`
2. Leave nickname field **completely empty**
3. Complete onboarding flow
4. Check Firebase console

**Expected Results:**
- ✅ No Firebase errors
- ✅ Onboarding completes successfully
- ✅ Firestore user doc either:
  - Has NO `nickname` field, OR
  - Has `nickname: null` (acceptable)
  - Does NOT have `nickname: undefined` (this causes error)

---

### **Test Case 4: Budget CTA Card Display**

**Steps:**
1. Complete onboarding with "Skip to Dashboard"
2. Land on dashboard
3. Check for CTA card visibility

**Expected Results:**
- ✅ CTA card is visible at top of dashboard
- ✅ Card has title: "Setup Budget Yuk!"
- ✅ Card has description
- ✅ "Setup Sekarang" button present
- ✅ Click button → redirects to `/budget?setupPrompt=dashboard`

**Then:**
4. Complete budget setup
5. Return to dashboard

**Expected Results:**
- ✅ CTA card is hidden/removed
- ✅ Dashboard shows budget info instead

---

### **Test Case 5: Terminology Consistency**

**Check these pages for correct terminology:**

1. **Onboarding page:**
   - ✅ Title: "Kapan Tracking Period Dimulai?" (or "Periode Tracking")
   - ✅ Preview: "Preview Tracking Period" or similar

2. **Dashboard:**
   - ✅ "Periode saat ini: 25 Okt - 24 Nov"
   - ✅ "Reset periode: 2 hari lagi"

3. **Settings:**
   - ✅ "Tracking Period Reset Date" or "Tanggal Reset Periode"

4. **Expenses:**
   - ✅ Period filter uses new terminology

**Verify:**
- ❌ No instances of "Budget Period" remain in UI
- ✅ Code variable names can stay as-is (optional to change)

---

### **Test Case 6: Mobile Responsiveness**

**Test on:**
- iPhone SE (375px width)
- iPhone 12 Pro (390px)
- Pixel 5 (393px)
- iPad (768px)

**Check:**
1. **Budget choice modal:**
   - ✅ Modal fits screen
   - ✅ Buttons stack vertically on mobile
   - ✅ Text readable
   - ✅ Close/tap outside works

2. **Budget CTA card:**
   - ✅ Card stacks on mobile
   - ✅ Icon, text, button layout correct
   - ✅ Touch targets minimum 44px

3. **Overall onboarding:**
   - ✅ All text readable
   - ✅ Buttons easy to tap
   - ✅ No horizontal scroll

---

### **Test Case 7: Confetti Animation**

**Verify confetti works on:**
- ✅ Chrome desktop
- ✅ Firefox desktop
- ✅ Safari desktop
- ✅ Chrome mobile
- ✅ Safari iOS

**Check:**
- ✅ Confetti animates from sides
- ✅ Duration approximately 2 seconds
- ✅ Doesn't block UI
- ✅ Cleans up after animation

---

### **Test Case 8: Error Scenarios**

**Test error handling:**

1. **Network failure during save:**
   - Disconnect internet
   - Try to complete onboarding
   - Expected: Error toast, can retry

2. **Firebase permission error:**
   - (If applicable)
   - Expected: Clear error message

3. **Invalid data:**
   - Select invalid date (edge case)
   - Expected: Validation prevents submission

---

## 🔄 VIII. Rollback Plan

### **If Issues Occur During Deployment**

#### **Quick Rollback Steps:**

1. **Terminology Changes:**
   ```bash
   # Search & replace back
   "Tracking Period" → "Budget Period"
   "Periode Tracking" → "Budget Period"
   ```

2. **Budget Choice Modal:**
   ```svelte
   <!-- Hide with CSS if needed -->
   .budget-choice-overlay {
     display: none !important;
   }
   ```
   OR
   ```svelte
   <!-- Comment out modal component -->
   {#if false && showBudgetChoice}
     <!-- ... modal code ... -->
   {/if}
   ```

3. **Firebase Changes:**
   - Revert `cleanProfileData()` usage
   - Keep `setDoc` with merge (this is safe)
   - Remove `preferences` if causing issues

4. **Dashboard CTA:**
   ```svelte
   <!-- Hide CTA card -->
   {#if false && !hasBudgetSetup}
     <!-- ... CTA card ... -->
   {/if}
   ```

#### **Data Migration:**

**Good news:** No database migration needed!
- New fields are optional
- Existing users unaffected
- `preferences` can be added on-demand
- Backward compatible

**If users have bad data:**
```typescript
// Quick fix script (run in Firebase console)
const usersRef = admin.firestore().collection('users');
const snapshot = await usersRef.where('nickname', '==', undefined).get();

snapshot.forEach(doc => {
  doc.ref.update({
    nickname: admin.firestore.FieldValue.delete()
  });
});
```

#### **Safe Deployment Strategy:**

1. **Stage 1: Terminology only**
   - Deploy just the string changes
   - Monitor for 24 hours
   - Check user feedback

2. **Stage 2: Firebase fixes**
   - Deploy error handling
   - Monitor Firestore logs
   - Check error rates

3. **Stage 3: New features**
   - Deploy budget choice modal
   - Deploy dashboard CTA
   - Monitor conversion rates

4. **Stage 4: Full rollout**
   - If all metrics good, declare success
   - Update documentation
   - Announce to users

---

## 📊 IX. Success Metrics

### **Technical Metrics**

**Target:** Measure before and after deployment

| Metric | Baseline | Target | How to Measure |
|--------|----------|--------|----------------|
| Firebase errors | ~X per day | 0 per day | Firebase Console errors |
| Onboarding completion rate | X% | >95% | Analytics |
| Average onboarding time | X seconds | <60 seconds | Custom tracking |
| Budget setup conversion | 0% | >40% | Track route taken |
| Page load performance | X ms | <2000ms | Lighthouse |

### **UX Metrics**

**Target:** Improve user experience

| Metric | How to Measure | Target |
|--------|----------------|--------|
| Budget setup path vs skip | Track button clicks | 60/40 split preferred |
| CTA card click-through rate | Dashboard CTA clicks | >30% CTR |
| User feedback/ratings | App store, surveys | >4.5/5 stars |
| Feature adoption | Users with budgets | >70% within 7 days |

### **Monitoring Tools**

1. **Firebase Console:**
   - Monitor errors in Functions
   - Check Firestore write operations
   - Review authentication logs

2. **Analytics:**
   - Track onboarding funnel
   - Monitor button clicks
   - Measure conversion rates

3. **User Feedback:**
   - In-app feedback forms
   - App store reviews
   - Support tickets

### **Success Criteria**

**Deployment is successful if:**
- ✅ Zero Firebase "undefined field" errors
- ✅ Onboarding completion rate >95%
- ✅ Budget setup conversion >30%
- ✅ No increase in support tickets
- ✅ Positive user feedback

**Consider rollback if:**
- ❌ Firebase errors increase
- ❌ Onboarding completion drops >10%
- ❌ Performance degrades significantly
- ❌ Negative user feedback spike

---

## 📝 X. Post-Implementation Notes

### **Documentation Updates**

After implementation, update:
1. **README.md** - Note terminology change
2. **API docs** - Update field descriptions
3. **User guides** - Update screenshots
4. **Support docs** - Update terminology

### **Future Enhancements**

**Possible improvements:**
1. **CTA card dismiss functionality**
   - Allow users to dismiss reminder
   - Track dismissal rate
   - Re-show after X days

2. **Onboarding analytics**
   - Track time spent per step
   - A/B test different copy
   - Optimize conversion funnel

3. **Budget setup wizard**
   - Pre-populate Indonesian categories
   - Smart budget suggestions
   - Import from bank statements

4. **Multi-language support**
   - Fully Indonesian version
   - Toggle language preference
   - Localized terminology

### **Known Limitations**

**Current:**
- CTA card cannot be dismissed
- No onboarding skip functionality
- Single language (ID/EN mix)
- No guided tutorial

**Acceptable because:**
- MVP focused on core functionality
- Can iterate based on feedback
- Technical foundation is solid

---

## ✅ XI. Conclusion

### **Summary**

This implementation plan provides:
- ✅ Clear "Tracking Period" terminology that makes sense without budget
- ✅ Fixed Firebase errors in onboarding
- ✅ Enhanced user experience with choice architecture
- ✅ Dashboard integration for budget setup reminder
- ✅ Comprehensive testing strategy
- ✅ Safe rollback procedures

### **Estimated Timeline**

| Phase | Time | Priority |
|-------|------|----------|
| Terminology Migration | 2-3 hours | High |
| Firebase Error Fixes | 1 hour | High |
| Onboarding Flow | 3-4 hours | High |
| Dashboard Integration | 2 hours | Medium |
| Testing & Polish | 2 hours | High |
| **Total** | **10-12 hours** | - |

### **Risk Assessment**

**Low Risk:**
- Terminology changes (reversible)
- Dashboard CTA (non-critical)

**Medium Risk:**
- Firebase data changes (tested, but affects all users)
- Onboarding flow changes (critical path)

**Mitigation:**
- Staged deployment
- Comprehensive testing
- Quick rollback plan
- Monitor closely

### **Next Steps**

1. ✅ Review this document
2. ✅ Confirm approach with team
3. ⏳ Begin Phase 1: Terminology
4. ⏳ Continue through phases sequentially
5. ⏳ Test thoroughly
6. ⏳ Deploy to staging
7. ⏳ Deploy to production
8. ⏳ Monitor and iterate

---

## 📞 Support & Questions

**For questions about this implementation:**
- Review specific sections above
- Check code examples
- Test in development first
- Ask for clarification as needed

**Document Version:** 1.0
**Last Updated:** October 1, 2025
**Status:** ✅ Ready for Implementation

---

**End of Document**
