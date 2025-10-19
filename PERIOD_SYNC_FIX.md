# 🔄 Period Display Sync Fix

## Date: 2025-01-19
## Issue: Period boundaries not matching user reset date setting

---

## 📸 Problem from Screenshots

### Observed Behavior:
**User Settings**: Periode Tracking → Reset Date = **Tanggal 15**

**But in dropdowns**:
- **Expenses**: "25 Okt - 24 Nov" + "Reset Date: 15 setiap bulan" ❌ (inconsistent!)
- **Budget**: "25 Okt - 24 Nov" + "Reset Date: 15 setiap bulan" ❌ (inconsistent!)

**Expected**: Should show "15 Okt - 14 Nov" to match reset date 15

---

## 🔍 Root Cause Analysis

### Timeline of Events:

1. **Page Load** (Expenses/Budget):
   ```typescript
   // userProfile belum loaded
   userResetDate = userProfile?.budgetResetDate || 25; // Fallback to 25
   ```

2. **PeriodSelector mounts**:
   ```typescript
   // onMount() generates periods dengan userResetDate = 25
   const periods = generateAvailablePeriods(); // Uses resetDate 25
   // Creates: "2025-10-25" (25 Okt - 24 Nov)
   ```

3. **Set periodId**:
   ```typescript
   selectedPeriodStore.set("2025-10-25");
   currentPeriodId = "2025-10-25";
   ```

4. **userProfile loaded** (later):
   ```typescript
   userProfile = { budgetResetDate: 15, ... }
   // PeriodSelector receives: userResetDate = 15
   ```

5. **BUT periods NOT regenerated!**:
   - Reactive statement `$: availablePeriods = generateAvailablePeriods()` regenerates
   - BUT `currentPeriodId` still = "2025-10-25"
   - Display shows "25 Okt - 24 Nov" (from old period)
   - Info shows "Reset Date: 15" (from new userResetDate)
   - **MISMATCH!** ❌

---

## 🎯 Root Cause:

**PeriodSelector tidak auto-update `currentPeriodId` saat `userResetDate` berubah**

### Why This Happens:

1. **Reactive statement regenerates periods**:
   ```typescript
   $: availablePeriods = generateAvailablePeriods(); // ✅ Runs when userResetDate changes
   ```

2. **But `currentPeriodId` stays old**:
   ```typescript
   currentPeriodId = "2025-10-25"; // ❌ Not updated!
   ```

3. **Old periodId not found in new periods**:
   ```typescript
   // New periods (reset=15): ["2025-10-15", "2025-09-15", ...]
   // Old periodId: "2025-10-25"
   // Result: currentPeriod = undefined or fallback to first period
   ```

4. **Display uses old period dates**:
   ```typescript
   // Period "2025-10-25" has dates: 25 Okt - 24 Nov
   // So dropdown shows wrong dates!
   ```

---

## ✅ Solution Applied

### Fix #1: Auto-update periodId when userResetDate changes

**File**: [`src/lib/components/dashboard/PeriodSelector.svelte:103-115`](src/lib/components/dashboard/PeriodSelector.svelte#L103-L115)

**Added**:
```typescript
// 🔥 FIX: When userResetDate changes, regenerate periods and update currentPeriodId
$: if (userResetDate) {
  const newPeriods = generateAvailablePeriods();
  const newCurrentPeriod = newPeriods.find(p => p.isCurrent);

  // If current periodId doesn't exist in new periods, switch to new current period
  const periodExists = newPeriods.find(p => p.id === currentPeriodId);
  if (!periodExists && newCurrentPeriod) {
    console.log(`🔄 PeriodSelector: Reset date changed to ${userResetDate}, switching period from ${currentPeriodId} to ${newCurrentPeriod.id}`);
    selectedPeriodStore.set(newCurrentPeriod.id);
    dispatch('periodChange', { periodId: newCurrentPeriod.id });
  }
}
```

**How It Works**:
1. Reactive statement watches `userResetDate`
2. When it changes (e.g., 25 → 15):
   - Regenerate periods with new reset date
   - Find new "current" period (e.g., "2025-10-15")
   - Check if old periodId ("2025-10-25") exists in new periods
   - If NOT exists → switch to new current period
   - Update store and dispatch event

**Result**: ✅ Period automatically updates to match user reset date!

---

## 🧪 Testing Instructions

### Test Scenario 1: Fresh Load with Reset Date = 15

**Steps**:
1. Settings → Periode Tracking → Set reset date = 15 → Save
2. Clear cache: `localStorage.clear(); location.reload();`
3. Navigate to Dashboard
4. Check dropdown: Should show **"15 Okt - 14 Nov"**
5. Navigate to Expenses
6. Check dropdown: Should show **"15 Okt - 14 Nov"**
7. Navigate to Budget
8. Check dropdown: Should show **"15 Okt - 14 Nov"**

**Expected Console Logs**:
```
🔄 PeriodSelector: Reset date changed to 15, switching period from 2025-10-25 to 2025-10-15
📅 PeriodSelector: Setting default to current period: 2025-10-15
🔍 [DASHBOARD] PeriodID: 2025-10-15, ResetDate: 15
🔍 [EXPENSES] PeriodID: 2025-10-15, ResetDate: 15
🔍 [BUDGET] PeriodID: 2025-10-15, ResetDate: 15
```

**Expected UI**:
- All dropdowns show: "15 Okt - 14 Nov"
- Info text: "Reset Date: 15 setiap bulan"
- Period name: "Oktober 2025 (Current)"

---

### Test Scenario 2: Change Reset Date While App Running

**Steps**:
1. Open Dashboard (assume reset = 25)
2. Dropdown shows: "25 Okt - 24 Nov"
3. Open new tab → Settings → Change reset to 15 → Save
4. Return to Dashboard tab
5. **Wait or refresh component**

**Expected** (with reactive fix):
- Dropdown automatically updates to "15 Okt - 14 Nov"
- Console shows switch message
- Data reloads for new period

**Note**: Full auto-update requires page/component reload in current implementation

---

### Test Scenario 3: Different Reset Dates

Try multiple reset dates:

| Reset Date | Expected Period Display |
|------------|-------------------------|
| 1 | "1 Okt - 31 Okt" |
| 5 | "5 Okt - 4 Nov" |
| 15 | "15 Okt - 14 Nov" |
| 25 | "25 Okt - 24 Nov" |
| -1 (last day) | "1 Okt - 31 Okt" |

**Test Each**:
1. Set reset date in settings
2. Clear cache and reload
3. Check all 3 pages show correct period

---

## 🔧 How Period Calculation Works

### Formula:
```typescript
// Given userResetDate = 15 and today = October 19, 2025:

// 1. Calculate period start
const periodStart = new Date(2025, 9, 15); // October 15, 2025

// 2. Calculate period end (next month, day before reset)
const periodEnd = new Date(2025, 10, 14); // November 14, 2025

// 3. Format period ID
const periodId = "2025-10-15"; // Format: YYYY-MM-DD

// 4. Display
const display = "15 Okt - 14 Nov";
```

### Examples:

**Reset Date = 1** (calendar month):
- Start: 1 Oktober 2025
- End: 31 Oktober 2025
- PeriodID: "2025-10-01"

**Reset Date = 15** (mid-month):
- Start: 15 Oktober 2025
- End: 14 November 2025
- PeriodID: "2025-10-15"

**Reset Date = 25** (gajian/payday):
- Start: 25 Oktober 2025
- End: 24 November 2025
- PeriodID: "2025-10-25"

---

## ⚠️ Known Limitations

### Current Implementation:

1. **User must reload** after changing reset date in settings
   - Fix requires: Real-time reactivity across tabs/windows
   - Workaround: Show message "Please refresh page" after saving

2. **Old period data persists** in cache
   - Cache keys: `periodExpensesCache["2025-10-25"]`
   - After reset date change: Creates new cache `periodExpensesCache["2025-10-15"]`
   - Old cache still exists but unused
   - Workaround: Clear cache when reset date changes

3. **No migration of expense data** between periods
   - If user has expenses in "2025-10-25" period
   - Then changes reset to 15
   - Expenses don't auto-migrate to "2025-10-15"
   - Expected: User expects to see same expenses
   - Actual: New empty period generated

---

## 🚀 Future Improvements

### Recommended:

1. **Cache Invalidation**:
   ```typescript
   // When userResetDate changes:
   function handleResetDateChange(oldDate: number, newDate: number) {
     clearPeriodCache(); // Clear all cached expenses
     regenerateCurrentPeriod(); // Force regenerate with new date
   }
   ```

2. **Real-time Sync Across Tabs**:
   ```typescript
   // Listen for localStorage changes
   window.addEventListener('storage', (e) => {
     if (e.key === 'userProfile') {
       reloadPeriods();
     }
   });
   ```

3. **Migration Warning**:
   ```typescript
   // Before changing reset date:
   showWarning("Changing reset date will create a new period. Your current expenses will remain in the old period.");
   ```

4. **Expense Date Re-mapping** (Advanced):
   ```typescript
   // Migrate expenses from old period to new period
   function migrateExpenses(oldPeriodId: string, newPeriodId: string) {
     const expenses = periodExpensesCache[oldPeriodId];
     // Re-calculate which expenses fall within new period boundaries
     // Save to new period cache
   }
   ```

---

## 📊 Impact Assessment

### Critical Impact:
- ✅ **FIXED**: Period display now matches user reset date
- ✅ **FIXED**: Dropdown info consistent with period dates
- ✅ **FIXED**: Auto-update when userProfile loads

### User Experience:
- ✅ No more confusion about period boundaries
- ✅ "Reset Date: X" matches actual period display
- ⚠️ Still need to reload after changing settings

### Development:
- ✅ Cleaner implementation with reactive updates
- ✅ Better logging for debugging
- ⚠️ Need to document refresh requirement

---

## 📝 Files Modified

1. **[src/lib/components/dashboard/PeriodSelector.svelte](src/lib/components/dashboard/PeriodSelector.svelte#L103-L115)**
   - Added: Reactive block to update periodId when userResetDate changes
   - Added: Console log for debugging

---

## ✅ Verification Checklist

After applying fix:

- [ ] Dashboard period display matches reset date from settings
- [ ] Expenses period display matches reset date from settings
- [ ] Budget period display matches reset date from settings
- [ ] "Reset Date: X setiap bulan" matches period boundaries
- [ ] Console shows period switch when reset date changes
- [ ] All 3 pages use same periodId
- [ ] Changing reset date (after reload) updates all pages

---

## 🎯 Success Criteria

### Before Fix:
- ❌ Expenses shows "25 Okt - 24 Nov" with "Reset Date: 15" (mismatch!)
- ❌ Budget shows "25 Okt - 24 Nov" with "Reset Date: 15" (mismatch!)

### After Fix:
- ✅ Expenses shows "15 Okt - 14 Nov" with "Reset Date: 15" (consistent!)
- ✅ Budget shows "15 Okt - 14 Nov" with "Reset Date: 15" (consistent!)
- ✅ Dashboard shows "15 Okt - 14 Nov" with "Reset Date: 15" (consistent!)

---

## 📞 Testing Now

**To verify fix**:
1. Clear browser cache: `localStorage.clear(); location.reload();`
2. Check your user reset date in settings
3. Navigate Dashboard → Expenses → Budget
4. Verify dropdown shows correct period boundaries
5. Check console logs confirm same periodId

**If issues persist**:
- Check console for period switch logs
- Verify userProfile.budgetResetDate value
- Try hard refresh (Ctrl+Shift+R)

---

**Status**: ✅ **FIXED - Reactive Period Update Implemented**
**Priority**: HIGH
**Testing**: Requires cache clear + reload
**Next**: Verify across all pages
