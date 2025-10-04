# 🧪 Test Cases: Flexible Budget Period Features

**Feature**: Flexible Budget Periods with Custom Reset Dates
**Version**: v4.0
**Last Updated**: September 30, 2025
**Status**: Ready for Testing

---

## 📋 Table of Contents

- [Overview](#overview)
- [Test Environment Setup](#test-environment-setup)
- [Test Cases](#test-cases)
  - [A. Onboarding Flow](#a-onboarding-flow---reset-date-selection)
  - [B. Dashboard](#b-dashboard---dual-mode-support)
  - [C. Expense Form](#c-expense-form---simple-mode-cta)
  - [D. Settings Page](#d-settings-page---reset-date-editor)
  - [E. Confirmation Modal](#e-confirmation-modal---reset-date-change)
  - [F. Test Page](#f-period-generation-test-page)
  - [G. Visual Consistency](#g-visual-consistency-tests)
  - [H. Responsive Design](#h-responsive-design-tests)
  - [I. Accessibility](#i-accessibility-tests)
  - [J. Performance](#j-performance-tests)
- [Testing Checklist](#testing-checklist-summary)
- [Bug Report Template](#bug-report-template)

---

## 📖 Overview

Dokumen ini berisi test cases untuk menguji **Flexible Budget Period Features** yang sudah diimplementasi, dengan fokus khusus pada **design visual** dan **user experience**.

### Features Being Tested:
1. ✅ Onboarding dengan reset date selection
2. ✅ Dashboard dual-mode (simple/full tracking)
3. ✅ Settings page dengan reset date editor
4. ✅ Confirmation modal untuk perubahan
5. ✅ Period generation logic
6. ✅ Glassmorphism design system
7. ✅ Responsive mobile layout
8. ✅ Error handling & validation

### Test Scope:
- **UI/UX**: Visual design, animations, interactions
- **Functionality**: Core features working correctly
- **Responsive**: Mobile, tablet, desktop layouts
- **Accessibility**: Keyboard navigation, screen reader
- **Performance**: Load times, rendering speed

---

## 🔧 Test Environment Setup

### Prerequisites:
```bash
# 1. Start development server
npm run dev

# 2. Server should be running at:
http://localhost:3000
```

### Test Routes:
- `/onboarding` - Onboarding flow with reset date selector
- `/dashboard` - Dashboard with dual-mode support
- `/expense` - Expense form with CTA
- `/settings` - Settings page with reset date editor
- `/test-period` - Period generation test page

### Mock Data Setup:
```typescript
// For testing Simple Mode (no budget):
userProfileStore.set({
  hasBudgetSetup: false,
  budgetResetDate: 25,
  budgetResetType: 'fixed'
});

// For testing Full Mode (with budget):
userProfileStore.set({
  hasBudgetSetup: true,
  budgetResetDate: 25,
  budgetResetType: 'fixed'
});
```

### Browser Testing:
- ✅ Chrome/Edge (primary)
- ✅ Firefox
- ✅ Safari (if available)
- ✅ Mobile browsers (Chrome Mobile, Safari iOS)

### Device Testing:
- 📱 Mobile: iPhone 12/13, Samsung Galaxy S21
- 📱 Tablet: iPad, Samsung Tab
- 💻 Desktop: 1920x1080, 1366x768

---

## 🧪 Test Cases

## A. Onboarding Flow - Reset Date Selection

### Test Case 1: Default Preset Selection
**Route**: `/onboarding`
**Priority**: 🔴 Critical

**Steps**:
1. Navigate to `/onboarding`
2. Complete Step 1 (Welcome)
3. Observe Step 2 (Reset Date Selection)

**Expected Results**:
- [ ] Halaman onboarding load dengan smooth (< 500ms)
- [ ] Step 2 muncul dengan 4 preset options + last day option
- [ ] Default selection adalah tanggal 25 (active state highlighted)
- [ ] Badge "Populer" muncul di tanggal 15 dan 25 (gradient orange)
- [ ] Glassmorphism effect terlihat jelas (blur + transparency)
- [ ] Hover effect bekerja:
  - Border berubah jadi cyan (rgba(0, 191, 255, 0.4))
  - TranslateY -2px
  - Shadow muncul (rgba(0, 191, 255, 0.1))

**Screenshot**: [Attach screenshot here]

**Notes**:
- Test dengan hover di setiap preset button
- Verify badge position tidak overlap dengan content

---

### Test Case 2: Period Preview
**Route**: `/onboarding` (Step 2)
**Priority**: 🔴 Critical

**Steps**:
1. Di Step 2, scroll ke section "Preview Budget Period"
2. Observe preview cards

**Expected Results**:
- [ ] Preview menampilkan 2 periods dalam grid
- [ ] Current period memiliki:
  - Badge "Current" dengan background hijau (#10b981)
  - Border cyan lebih tebal
  - Background gradient cyan
- [ ] Tanggal formatted dalam Bahasa Indonesia:
  - Format: "25 Jan - 24 Feb 2025"
- [ ] Jumlah hari dihitung dengan benar:
  - Display: "30 hari" atau sesuai actual days
- [ ] Info reset schedule muncul di bawah preview:
  - Icon 🔄
  - Text: "Reset setiap: Tanggal 25"
  - Icon 📊
  - Text: "Budget akan direset otomatis setiap periode baru"

**Screenshot**: [Attach screenshot here]

**Notes**:
- Verify date calculation accuracy
- Check Indonesian date format correctness

---

### Test Case 3: Custom Input
**Route**: `/onboarding` (Step 2)
**Priority**: 🟡 High

**Steps**:
1. Check "Custom tanggal" checkbox
2. Enter various numbers in input (1, 15, 31, -1, 50)
3. Try typing when "Akhir bulan" is selected

**Expected Results**:
- [ ] Custom input disabled saat last-day selected (opacity reduced)
- [ ] Input menerima angka 1-31 only
- [ ] Input rejects angka < 1 atau > 31
- [ ] Preview update real-time saat ubah custom date
- [ ] Auto-focus saat enable custom checkbox
- [ ] Period preview recalculates immediately

**Screenshot**: [Attach screenshot here]

**Notes**:
- Test dengan keyboard input dan number arrows
- Verify validation prevents invalid dates

---

### Test Case 4: Mobile Responsive - Onboarding
**Route**: `/onboarding`
**Priority**: 🔴 Critical
**Device**: Mobile (< 768px width)

**Steps**:
1. Open `/onboarding` di mobile device atau DevTools mobile view
2. Complete onboarding flow

**Expected Results**:
- [ ] Layout berubah jadi single column di mobile
- [ ] Preset buttons stack vertical dengan gap-3
- [ ] All buttons accessible dan tidak overlap
- [ ] Touch target minimal 44px height
- [ ] Preview cards stack vertical (grid-template-columns: 1fr)
- [ ] Actions buttons full width di mobile
- [ ] Text tetap readable (tidak terlalu kecil)
- [ ] Padding adjusted (1rem instead of 2rem)

**Screenshot**: [Attach mobile screenshot here]

**Notes**:
- Test di actual mobile device jika memungkinkan
- Verify no horizontal scroll

---

## B. Dashboard - Dual Mode Support

### Test Case 5: Simple Mode (No Budget)
**Route**: `/dashboard`
**Priority**: 🔴 Critical
**Setup**: Set `hasBudgetSetup: false` in userProfileStore

**Steps**:
1. Set mock data: `hasBudgetSetup: false`
2. Navigate to `/dashboard`
3. Observe hero card and layout

**Expected Results**:
- [ ] Hero card menampilkan "Total Pengeluaran 💸"
- [ ] Period range ditampilkan dengan format Indonesia
  - Example: "25 Jan - 24 Feb 2025"
- [ ] Total pengeluaran menggunakan format Rupiah
  - Example: "Rp 1.234.567"
- [ ] CTA card "Mau tracking lebih detail?" muncul dengan prominent
  - Background: rgba(0, 191, 255, 0.1)
  - Border: cyan
  - Rounded corners
- [ ] Button "Setup Budget Sekarang" dengan:
  - Gradient background (cyan → blue)
  - Arrow icon →
  - Hover effect: translateY -2px
- [ ] Glassmorphism effect consistent dengan design system
- [ ] No category breakdown cards visible

**Screenshot**: [Attach screenshot here]

**Notes**:
- Verify CTA clickable dan navigate ke `/budget`
- Check Rupiah formatting (thousand separator)

---

### Test Case 6: Full Mode (With Budget)
**Route**: `/dashboard`
**Priority**: 🔴 Critical
**Setup**: Set `hasBudgetSetup: true` in userProfileStore

**Steps**:
1. Set mock data: `hasBudgetSetup: true`
2. Navigate to `/dashboard`
3. Observe full dashboard layout

**Expected Results**:
- [ ] Dashboard menampilkan budget status cards
- [ ] Hero card shows budget summary dengan progress
- [ ] Category breakdown visible dengan cards
- [ ] Progress bars dengan warna sesuai status:
  - Safe: Green (#10b981)
  - Warning: Yellow (#f59e0b)
  - Danger: Orange (#f97316)
  - Over: Red (#ef4444)
- [ ] CTA card tidak muncul (tersembunyi dengan conditional)
- [ ] Category icons dan amounts displayed correctly

**Screenshot**: [Attach screenshot here]

**Notes**:
- Test switching between modes dengan toggle hasBudgetSetup
- Verify smooth transition

---

### Test Case 7: Settings Quick Link
**Route**: `/dashboard`
**Priority**: 🟡 High

**Steps**:
1. Navigate to `/dashboard`
2. Look at header section (top right area)
3. Hover over Settings button
4. Click Settings button

**Expected Results**:
- [ ] Settings button (⚙️) muncul di header kanan
- [ ] Button styling:
  - Glassmorphism background
  - Border: rgba(255, 255, 255, 0.3)
  - Padding: 0.75rem
  - Rounded: 12px
- [ ] Hover effect:
  - Icon rotate 90° smooth (transition: 0.3s ease)
  - Border color change ke cyan
  - TranslateY -2px
- [ ] Button clickable dan navigasi ke `/settings`
- [ ] Glassmorphism design matching theme
- [ ] Icon size appropriate (text-lg)

**Screenshot**: [Attach screenshot here]

**Notes**:
- Test rotation animation smoothness
- Verify button position di mobile dan desktop

---

## C. Expense Form - Simple Mode CTA

### Test Case 8: Info Box Display
**Route**: `/expense` atau Modal ExpenseForm
**Priority**: 🟡 High
**Setup**: Set `hasBudgetSetup: false`

**Steps**:
1. Set mock data: `hasBudgetSetup: false`
2. Open expense form (page or modal)
3. Observe info box location and content

**Expected Results**:
- [ ] Info box muncul below amount input, above description
- [ ] Icon 💡 terlihat jelas di kiri
- [ ] Text content:
  - Bold: "Setup budget untuk tracking lebih detail!"
  - Regular: "Track pengeluaran per kategori dan dapat warning otomatis"
- [ ] Button "Setup Budget Sekarang →" dengan:
  - Link ke `/budget`
  - Cyan background
  - Arrow icon
- [ ] Background biru dengan rounded corners
  - Background: rgba(59, 130, 246, 0.1)
  - Border: rgba(59, 130, 246, 0.3)
- [ ] Hover effect pada button:
  - Background darker
  - TranslateY -1px

**Screenshot**: [Attach screenshot here]

**Notes**:
- Verify info box tidak mengganggu form flow
- Check button navigation works

---

### Test Case 9: Info Box Hidden (Full Mode)
**Route**: `/expense`
**Priority**: 🟡 High
**Setup**: Set `hasBudgetSetup: true`

**Steps**:
1. Set mock data: `hasBudgetSetup: true`
2. Open expense form
3. Verify info box tidak muncul

**Expected Results**:
- [ ] Info box tidak muncul (conditional rendering)
- [ ] Category selector enabled dan berfungsi
- [ ] Category dropdown populated dengan categories
- [ ] Form layout tetap rapi tanpa info box
- [ ] Spacing consistent

**Screenshot**: [Attach screenshot here]

**Notes**:
- Test switching mode untuk verify conditional
- No console errors

---

## D. Settings Page - Reset Date Editor

### Test Case 10: Page Load & Current Settings
**Route**: `/settings`
**Priority**: 🔴 Critical

**Steps**:
1. Navigate to `/settings`
2. Wait for page load
3. Observe initial state

**Expected Results**:
- [ ] Page load dengan smooth animation (< 500ms)
- [ ] Back button (← Dashboard) di header
  - Icon ←
  - Text "Dashboard"
  - Hover effect
- [ ] Loading skeleton muncul sebelum data load
  - Gray animated placeholder
- [ ] Current reset date displayed di highlighted card:
  - Background: rgba(59, 130, 246, 0.1)
  - Border: cyan
  - Bold text showing current date
- [ ] Page title: "Settings"
- [ ] Subtitle: "Kelola preferensi budget period kamu"
- [ ] Glassmorphism design consistent

**Screenshot**: [Attach screenshot here]

**Notes**:
- Verify back button navigation works
- Check loading state duration reasonable

---

### Test Case 11: Preset Selection UI
**Route**: `/settings`
**Priority**: 🔴 Critical

**Steps**:
1. Scroll to "Preset Options" section
2. Observe preset cards layout
3. Click different presets

**Expected Results**:
- [ ] 4 preset cards (1, 5, 15, 25) dalam grid:
  - Grid: 2x2 on desktop
  - Gap: 0.75rem
- [ ] Last day option dengan checkbox visual:
  - Separate card below presets
  - Checkbox icon atau indicator
- [ ] Active state styling:
  - Border: rgba(0, 191, 255, 0.7) (cyan thicker)
  - Background: gradient cyan
  - Box-shadow: rgba(0, 191, 255, 0.15)
- [ ] Hover effect:
  - TranslateY -2px
  - Border color change
  - Shadow increase
- [ ] Icon dan text alignment perfect:
  - Icon (📅) di kiri
  - Label bold di tengah
  - Description below
- [ ] "Popular" badge pada 15 dan 25:
  - Orange gradient background
  - White text
  - Positioned top-right

**Screenshot**: [Attach screenshot here]

**Notes**:
- Test clicking setiap preset
- Verify active state immediate update

---

### Test Case 12: Custom Input Interaction
**Route**: `/settings`
**Priority**: 🟡 High

**Steps**:
1. Find "Custom tanggal" section
2. Enable custom checkbox
3. Enter various values (valid and invalid)
4. Try with last-day option selected

**Expected Results**:
- [ ] Custom checkbox enable/disable input number
- [ ] Number input validation (1-31):
  - Min: 1
  - Max: 31
  - Step: 1
- [ ] Input disabled saat last-day selected:
  - Opacity: 0.5
  - Cursor: not-allowed
- [ ] Error state jika input < 1 atau > 31:
  - Red border
  - Error text below input
- [ ] Error message dengan shake animation:
  - Animation: shake keyframes
  - Duration: 0.5s
  - Red background

**Screenshot**: [Attach screenshot here]

**Notes**:
- Test edge cases: 0, 32, -5, 100
- Verify shake animation triggers

---

### Test Case 13: Change Preview Calculation
**Route**: `/settings`
**Priority**: 🔴 Critical

**Steps**:
1. Select reset date berbeda dari current (e.g., 1 → 15)
2. Scroll to "Impact Perubahan" section
3. Observe preview details

**Expected Results**:
- [ ] Preview card muncul dengan smooth animation (fadeIn)
- [ ] Warning icon ⚠️ jika period akan close early:
  - Yellow/orange color
  - Positioned prominently
- [ ] Current period dates displayed:
  - Format: "25 Jan - 24 Feb 2025"
  - Clear label: "Current Period"
- [ ] Transition period dates (jika applicable):
  - Label: "⚠️ Period akan ditutup lebih awal"
  - Format: "25 Jan - 14 Feb 2025"
  - Days count: "20 hari (10 hari lebih pendek)"
- [ ] New period dates displayed:
  - Label: "New Period (mulai sekarang)"
  - Format: "15 Feb - 14 Mar 2025"
- [ ] Future periods explanation:
  - Text: "Akan menggunakan reset date baru"
- [ ] Notes section dengan bullet points:
  - "Data historis tetap aman dan tidak berubah"
  - "Budget untuk period saat ini akan direset"
  - "Period baru dimulai dari tanggal reset yang dipilih"

**Screenshot**: [Attach screenshot here]

**Notes**:
- Test various scenarios: earlier date, later date, same month
- Verify calculations accurate

---

### Test Case 14: Save Button State
**Route**: `/settings`
**Priority**: 🟡 High

**Steps**:
1. Observe initial button state
2. Select different reset date
3. Revert to original
4. Enter invalid custom date

**Expected Results**:
- [ ] Button disabled jika tidak ada perubahan:
  - Opacity: 0.6
  - Cursor: not-allowed
  - Background: gray
- [ ] Button enabled jika reset date berubah:
  - Opacity: 1
  - Cursor: pointer
  - Background: gradient cyan
- [ ] Button disabled jika validation error:
  - Same as no change state
- [ ] Loading state dengan spinner saat saving:
  - Spinner icon rotating
  - Text: "Menyimpan..."
  - Button disabled

**Screenshot**: [Attach screenshot here]

**Notes**:
- Verify button state updates immediately
- Test button cannot be clicked when disabled

---

## E. Confirmation Modal - Reset Date Change

### Test Case 15: Modal Display
**Route**: `/settings`
**Priority**: 🔴 Critical

**Steps**:
1. Change reset date di settings
2. Click "Simpan Perubahan" button
3. Observe modal appearance

**Expected Results**:
- [ ] Modal muncul dengan backdrop blur:
  - Backdrop: rgba(0, 0, 0, 0.6)
  - Blur: blur(10px)
- [ ] Glassmorphism modal card centered:
  - Width: max-w-md
  - Border-radius: 16px
  - Box-shadow: large
- [ ] Header: "Konfirmasi Perubahan Reset Date"
  - Font: bold, text-xl
  - Icon: ⚠️
- [ ] Change summary: "Dari: X → Ke: Y"
  - Large text
  - Arrow visual
  - Old vs new comparison
- [ ] Warning box dengan icon dan details:
  - Yellow/orange background
  - Icon: ⚠️
  - Bullet points of impacts
- [ ] Two buttons: "Batal" dan "Ya, Ubah"
  - Batal: secondary style (gray)
  - Ya, Ubah: primary style (cyan gradient)

**Screenshot**: [Attach screenshot here]

**Notes**:
- Modal should be centered vertically and horizontally
- Text should be readable

---

### Test Case 16: Modal Interactions
**Route**: `/settings`
**Priority**: 🔴 Critical

**Steps**:
1. Open confirmation modal
2. Try different ways to close
3. Confirm the change

**Expected Results**:
- [ ] Click backdrop to close:
  - Modal closes smoothly
  - Returns to settings page
- [ ] Press Escape to close:
  - Same behavior as backdrop click
- [ ] Cancel button closes modal:
  - No changes applied
  - Modal closes
- [ ] Confirm button shows loading state:
  - Button disabled
  - Spinner appears
  - Text: "Mengubah..."
- [ ] Spinner animation saat processing:
  - Rotating continuously
  - Smooth 1s linear animation
- [ ] Modal closes after successful change:
  - Settings page updates
  - Current date reflects new value
  - Success notification (if implemented)

**Screenshot**: [Attach screenshot here]

**Notes**:
- Test keyboard and mouse interactions
- Verify async operation handling

---

### Test Case 17: Modal Animations
**Route**: `/settings`
**Priority**: 🟢 Medium

**Steps**:
1. Open and close modal multiple times
2. Observe animation smoothness

**Expected Results**:
- [ ] Backdrop fade-in animation:
  - From: opacity 0
  - To: opacity 0.6
  - Duration: 300ms
  - Easing: ease
- [ ] Modal scale animation:
  - From: scale(0.95)
  - To: scale(1)
  - Duration: 300ms
  - Easing: ease
- [ ] Smooth transitions (0.3s ease):
  - No janky movements
  - No layout shifts
- [ ] Exit animation reversed:
  - Opacity 0.6 → 0
  - Scale 1 → 0.95
  - Same duration and easing

**Screenshot**: [Attach screenshot or video]

**Notes**:
- Record video if possible untuk verify smoothness
- Test di different browsers

---

## F. Period Generation Test Page

### Test Case 18: Configuration Selector
**Route**: `/test-period`
**Priority**: 🟢 Medium

**Steps**:
1. Navigate to `/test-period`
2. Click different config buttons
3. Adjust period count slider

**Expected Results**:
- [ ] 6 preset configs dalam grid:
  - Reset tanggal 1
  - Reset tanggal 5
  - Reset tanggal 15
  - Reset tanggal 25
  - Reset tanggal 31
  - Reset akhir bulan
- [ ] Active config dengan border accent:
  - Cyan border thick
  - Background highlight
- [ ] Period count slider (1-24) berfungsi:
  - Smooth sliding
  - Value display updates
  - Range: 1 to 24
- [ ] Real-time update saat config berubah:
  - Periods regenerate immediately
  - No loading delay
  - Smooth transition

**Screenshot**: [Attach screenshot here]

**Notes**:
- Useful for developer testing
- Verify performance dengan 24 periods

---

### Test Case 19: Period Visualization
**Route**: `/test-period`
**Priority**: 🟢 Medium

**Steps**:
1. Select config (e.g., Reset 25)
2. Observe generated periods grid
3. Find current period

**Expected Results**:
- [ ] Generated periods dalam grid cards:
  - Grid: 2-3 columns on desktop
  - Responsive on mobile
- [ ] Current period highlighted dengan badge:
  - Badge: "Current" green
  - Border: cyan thicker
  - Background: gradient
- [ ] Date format Bahasa Indonesia:
  - Format: "25 Jan - 24 Feb 2025"
  - Month names: Jan, Feb, Mar (abbreviated)
- [ ] Days count displayed:
  - Text: "30 hari"
  - Calculated correctly
- [ ] Reset date metadata visible:
  - Small text below dates
  - Shows reset date used

**Screenshot**: [Attach screenshot here]

**Notes**:
- Verify dates make sense
- Check no date overlaps

---

### Test Case 20: Edge Cases Section
**Route**: `/test-period`
**Priority**: 🟡 High

**Steps**:
1. Scroll to "Edge Cases" section
2. Click "Test Reset 31 di Feb" button
3. Click "Test Last Day of Month" button
4. Click "Test Year Boundary" button

**Expected Results**:
- [ ] Test "Reset 31 di Feb" button:
  - Generates periods with reset 31
  - February shows adjusted date (28 or 29)
  - Other months show 31
- [ ] Result shows adjusted date clearly:
  - Label: "Adjusted to 28/29 in Feb"
  - Explanation visible
- [ ] Test "Last day of month" variations:
  - Shows different months (Jan: 31, Feb: 28, Apr: 30)
  - Correctly handles each month
- [ ] Test "Year boundary" crossing:
  - Period spans Dec 31 → Jan 1
  - Year increments correctly
  - No date calculation errors
- [ ] Results displayed with clear formatting:
  - Code block or table
  - Easy to read
  - Color-coded success/info

**Screenshot**: [Attach screenshot here]

**Notes**:
- Critical for verifying period logic correctness
- Test in leap year and non-leap year

---

## G. Visual Consistency Tests

### Test Case 21: Glassmorphism Design System
**Route**: All pages
**Priority**: 🔴 Critical

**Steps**:
1. Visit `/onboarding`, `/dashboard`, `/settings`
2. Inspect card elements
3. Verify consistency

**Expected Results**:
- [ ] Consistent backdrop-filter: blur(25px)
- [ ] Consistent gradient backgrounds:
  - Primary: `linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(240, 248, 255, 0.4))`
  - Active: `linear-gradient(135deg, rgba(0, 191, 255, 0.1), rgba(30, 144, 255, 0.1))`
- [ ] Consistent border: `rgba(255, 255, 255, 0.3)` 2px
- [ ] Consistent shadow: `0 8px 32px rgba(0, 191, 255, 0.15)`
- [ ] Smooth hover transitions:
  - Duration: 0.3s
  - Easing: ease
  - Properties: transform, border-color, box-shadow
- [ ] Active state dengan cyan accent:
  - Border: `rgba(0, 191, 255, 0.7)`
  - Background: cyan gradient
  - Shadow: cyan glow

**Screenshot**: [Attach screenshots from multiple pages]

**Notes**:
- Use browser DevTools to inspect CSS values
- Compare across pages for consistency

---

### Test Case 22: Typography & Spacing
**Route**: All pages
**Priority**: 🟡 High

**Steps**:
1. Visit all main pages
2. Inspect typography and spacing
3. Verify consistency

**Expected Results**:
- [ ] Headings consistent:
  - H1: font-bold, text-2xl (24px)
  - H2: font-bold, text-xl (20px)
  - H3: font-semibold, text-lg (18px)
- [ ] Body text readable:
  - Color: text-gray-700
  - Size: text-base (16px)
  - Line-height: 1.5-1.6
- [ ] Consistent padding:
  - Cards: p-6 (1.5rem)
  - Buttons: px-6 py-3
  - Sections: p-4 atau p-6
- [ ] Consistent margins:
  - Between sections: gap-4 atau gap-6
  - Between elements: space-y-4
- [ ] Line heights comfortable:
  - Headings: leading-tight (1.25)
  - Body: leading-relaxed (1.625)

**Screenshot**: [Attach screenshot here]

**Notes**:
- Check reading comfort pada body text
- Verify hierarchy clear

---

### Test Case 23: Color Scheme
**Route**: All pages
**Priority**: 🟡 High

**Steps**:
1. Visit all pages
2. Observe color usage
3. Verify consistency

**Expected Results**:
- [ ] Primary: Cyan-blue gradient
  - Start: #00bfff (DeepSkyBlue)
  - End: #1e90ff (DodgerBlue)
- [ ] Success: Green (#10b981)
  - Used for: Success states, current period
- [ ] Warning: Orange (#f59e0b)
  - Used for: Warning states, near limit
- [ ] Danger: Red (#ef4444)
  - Used for: Error states, over budget
- [ ] Info: Blue (#3b82f6)
  - Used for: Info boxes, hints
- [ ] Neutral: Gray scale consistent
  - Text: #374151 (gray-700)
  - Borders: #d1d5db (gray-300)
  - Backgrounds: #f9fafb (gray-50)

**Screenshot**: [Attach screenshot here]

**Notes**:
- Color contrast should meet WCAG AA standards
- Test readability of text on colored backgrounds

---

## H. Responsive Design Tests

### Test Case 24: Mobile (< 768px)
**Route**: All pages
**Priority**: 🔴 Critical
**Device**: Mobile phone or DevTools mobile view

**Steps**:
1. Resize browser to mobile width (375px - 767px)
2. Navigate through all pages
3. Test all interactions

**Expected Results**:
- [ ] Onboarding: Single column layout
  - Preset buttons full width
  - Preview cards stacked
  - Actions buttons full width
- [ ] Dashboard: Stacked cards
  - Hero card full width
  - Category cards single column
  - No horizontal scroll
- [ ] Settings: Preset grid becomes 2 columns
  - 2x2 grid on mobile
  - Comfortable touch targets
  - Modal full width (with padding)
- [ ] Modal: Full width with padding
  - Max-width: 90vw
  - Padding: 1rem
- [ ] Navigation: Hamburger menu works
  - Menu toggles
  - Items accessible
  - Active state visible

**Screenshot**: [Attach mobile screenshots]

**Notes**:
- Test on actual mobile device if possible
- Verify touch targets ≥ 44x44px

---

### Test Case 25: Tablet (768px - 1024px)
**Route**: All pages
**Priority**: 🟡 High
**Device**: Tablet or DevTools tablet view

**Steps**:
1. Resize browser to tablet width (768px - 1024px)
2. Navigate through pages
3. Test layouts

**Expected Results**:
- [ ] 2-column grids where applicable
  - Preset options: 2 columns
  - Period cards: 2 columns
  - Category cards: 2 columns
- [ ] Comfortable touch targets (min 44px)
  - Buttons properly sized
  - Cards not too small
- [ ] Readable text sizes
  - Font sizes scaled appropriately
  - No text too small
- [ ] No horizontal scroll
  - All content fits
  - Proper container widths

**Screenshot**: [Attach tablet screenshot]

**Notes**:
- Test both portrait and landscape orientations
- iPad size: 768x1024, 834x1112

---

### Test Case 26: Desktop (> 1024px)
**Route**: All pages
**Priority**: 🟡 High
**Device**: Desktop monitor

**Steps**:
1. View pages at 1920x1080 and 1366x768
2. Verify layouts and spacing

**Expected Results**:
- [ ] Max-width containers (600px-800px)
  - Content centered
  - Comfortable reading width
- [ ] Centered layouts
  - Margin: auto on containers
  - Even spacing on sides
- [ ] Hover effects active
  - All interactive elements have hover
  - Transitions smooth
- [ ] Optimal use of space
  - Not too cramped
  - Not too spread out
  - White space balanced

**Screenshot**: [Attach desktop screenshot]

**Notes**:
- Test at common resolutions: 1920x1080, 1366x768, 1440x900
- Verify no weird spacing issues

---

## I. Accessibility Tests

### Test Case 27: Keyboard Navigation
**Route**: All pages
**Priority**: 🟡 High

**Steps**:
1. Use only keyboard (no mouse)
2. Tab through all elements
3. Test interactions

**Expected Results**:
- [ ] Tab through all interactive elements
  - Buttons, inputs, links focusable
  - Tab order logical (top to bottom, left to right)
- [ ] Focus visible dengan outline
  - Blue outline on focused elements
  - Min 2px outline width
  - High contrast
- [ ] Enter/Space activate buttons
  - Enter triggers button click
  - Space triggers checkbox/select
- [ ] Escape closes modals
  - Confirmation modal closes with Esc
  - Dropdown closes with Esc
- [ ] No keyboard traps
  - Can navigate out of all sections
  - Modal can be closed with keyboard

**Screenshot**: [Attach screenshot showing focus state]

**Notes**:
- Test with actual keyboard, not simulated
- Common pattern: Tab (forward), Shift+Tab (backward)

---

### Test Case 28: Screen Reader
**Route**: All pages
**Priority**: 🟢 Medium
**Tool**: NVDA (Windows) or VoiceOver (Mac)

**Steps**:
1. Enable screen reader
2. Navigate through pages
3. Verify announcements

**Expected Results**:
- [ ] Labels pada form inputs
  - All inputs have associated labels
  - Label text read aloud
- [ ] Alt text pada icons (if any)
  - Decorative icons: aria-hidden="true"
  - Meaningful icons: proper alt text
- [ ] Aria labels untuk buttons
  - Button purpose announced
  - Icon-only buttons have aria-label
- [ ] Proper heading hierarchy (h1 → h2 → h3)
  - Only one h1 per page
  - Headings in order
  - No skipping levels

**Screenshot**: [N/A - Audio test]

**Notes**:
- Test with at least one screen reader
- NVDA (free) or VoiceOver (built-in Mac)

---

## J. Performance Tests

### Test Case 29: Load Times
**Route**: All pages
**Priority**: 🟡 High
**Tool**: Chrome DevTools Network/Performance tab

**Steps**:
1. Open Chrome DevTools
2. Go to Network tab
3. Hard refresh each page (Ctrl+Shift+R)
4. Record load times

**Expected Results**:
- [ ] Onboarding load < 500ms
  - DOMContentLoaded < 300ms
  - Load event < 500ms
- [ ] Dashboard load < 1s
  - Initial render < 500ms
  - Full interactive < 1s
- [ ] Settings load < 500ms
  - Page appears < 300ms
  - Interactive < 500ms
- [ ] Modal open < 200ms
  - Appears immediately
  - Animation completes < 300ms
- [ ] No layout shifts (CLS < 0.1)
  - Cumulative Layout Shift score
  - Elements don't jump
  - Reserved space for dynamic content

**Screenshot**: [Attach Network tab screenshot]

**Notes**:
- Test on throttled network (Fast 3G) untuk worst-case
- Use Lighthouse untuk comprehensive score

---

### Test Case 30: Period Generation Speed
**Route**: `/test-period`
**Priority**: 🟢 Medium
**Tool**: Browser console with performance.now()

**Steps**:
1. Open `/test-period`
2. Open browser console
3. Generate different period counts
4. Measure execution time

**Expected Results**:
- [ ] 6 periods generated < 50ms
  - Real-time update feels instant
- [ ] 12 periods generated < 100ms
  - Smooth update
  - No visible delay
- [ ] 24 periods generated < 200ms
  - Acceptable delay
  - UI not blocked
- [ ] No blocking UI during calculation
  - Page remains responsive
  - Animations smooth
  - No frame drops

**Screenshot**: [Attach console screenshot with times]

**Notes**:
- Test pada low-end device jika memungkinkan
- Verify no memory leaks dengan multiple generations

---

## 📋 Testing Checklist Summary

### Quick Reference

**Total Test Cases**: 30

#### By Priority:
- 🔴 **Critical**: 15 test cases (Must Pass)
- 🟡 **High**: 11 test cases (Should Pass)
- 🟢 **Medium**: 4 test cases (Nice to Have)

#### By Category:
- **A. Onboarding Flow**: 4 test cases
- **B. Dashboard**: 3 test cases
- **C. Expense Form**: 2 test cases
- **D. Settings Page**: 5 test cases
- **E. Confirmation Modal**: 3 test cases
- **F. Test Page**: 3 test cases
- **G. Visual Consistency**: 3 test cases
- **H. Responsive Design**: 3 test cases
- **I. Accessibility**: 2 test cases
- **J. Performance**: 2 test cases

#### Testing Progress Tracker:

```
[ ] Test Case 1: Default Preset Selection (Critical)
[ ] Test Case 2: Period Preview (Critical)
[ ] Test Case 3: Custom Input (High)
[ ] Test Case 4: Mobile Responsive - Onboarding (Critical)
[ ] Test Case 5: Simple Mode (No Budget) (Critical)
[ ] Test Case 6: Full Mode (With Budget) (Critical)
[ ] Test Case 7: Settings Quick Link (High)
[ ] Test Case 8: Info Box Display (High)
[ ] Test Case 9: Info Box Hidden (High)
[ ] Test Case 10: Page Load & Current Settings (Critical)
[ ] Test Case 11: Preset Selection UI (Critical)
[ ] Test Case 12: Custom Input Interaction (High)
[ ] Test Case 13: Change Preview Calculation (Critical)
[ ] Test Case 14: Save Button State (High)
[ ] Test Case 15: Modal Display (Critical)
[ ] Test Case 16: Modal Interactions (Critical)
[ ] Test Case 17: Modal Animations (Medium)
[ ] Test Case 18: Configuration Selector (Medium)
[ ] Test Case 19: Period Visualization (Medium)
[ ] Test Case 20: Edge Cases Section (High)
[ ] Test Case 21: Glassmorphism Design System (Critical)
[ ] Test Case 22: Typography & Spacing (High)
[ ] Test Case 23: Color Scheme (High)
[ ] Test Case 24: Mobile (< 768px) (Critical)
[ ] Test Case 25: Tablet (768px - 1024px) (High)
[ ] Test Case 26: Desktop (> 1024px) (High)
[ ] Test Case 27: Keyboard Navigation (High)
[ ] Test Case 28: Screen Reader (Medium)
[ ] Test Case 29: Load Times (High)
[ ] Test Case 30: Period Generation Speed (Medium)
```

**Overall Progress**: 0 / 30 (0%)

---

## 🐛 Bug Report Template

Jika menemukan bug saat testing, gunakan template ini:

```markdown
### Bug Report #XXX

**Test Case**: [Test Case Number & Name]
**Priority**: 🔴 Critical / 🟡 High / 🟢 Medium / ⚪ Low
**Status**: Open / In Progress / Resolved

**Environment**:
- Browser: [e.g., Chrome 120.0.6099.110]
- OS: [e.g., Windows 11, macOS 14.0]
- Device: [e.g., Desktop 1920x1080, iPhone 13]
- Screen Size: [e.g., 1920x1080]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Screenshot/Video**:
[Attach screenshot or video]

**Console Errors** (if any):
```
[Paste console errors here]
```

**Additional Notes**:
[Any other relevant information]

**Severity**:
- [ ] Blocks testing
- [ ] Breaks functionality
- [ ] Visual issue only
- [ ] Minor inconvenience

**Suggested Fix** (optional):
[Your suggestion]
```

---

## 📊 Test Results Template

Setelah selesai testing, isi summary ini:

```markdown
## Test Results Summary

**Date**: [Date of testing]
**Tester**: [Your name]
**Environment**: [Browser, OS, Device]

### Overall Results:
- Total Test Cases: 30
- Passed: XX / 30 (XX%)
- Failed: XX / 30 (XX%)
- Skipped: XX / 30 (XX%)

### By Priority:
- Critical (15): Passed XX, Failed XX
- High (11): Passed XX, Failed XX
- Medium (4): Passed XX, Failed XX

### By Category:
- Onboarding Flow: XX/4
- Dashboard: XX/3
- Expense Form: XX/2
- Settings Page: XX/5
- Confirmation Modal: XX/3
- Test Page: XX/3
- Visual Consistency: XX/3
- Responsive Design: XX/3
- Accessibility: XX/2
- Performance: XX/2

### Critical Issues Found:
1. [Issue description]
2. [Issue description]

### Recommendations:
1. [Recommendation]
2. [Recommendation]

### Next Steps:
- [ ] Fix critical bugs
- [ ] Re-test failed cases
- [ ] Deploy to staging
```

---

## 📚 Additional Resources

### Related Documentation:
- [DISCUSSION_SUMMARY_BUDGET_PERIOD.md](./DISCUSSION_SUMMARY_BUDGET_PERIOD.md) - Feature discussion
- [IMPLEMENTATION_PLAN_FLEXIBLE_PERIODS.md](./IMPLEMENTATION_PLAN_FLEXIBLE_PERIODS.md) - Implementation plan
- [IMPLEMENTATION_PROGRESS.md](./IMPLEMENTATION_PROGRESS.md) - Development progress
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - Project vision

### Testing Tools:
- **Chrome DevTools**: Inspect, debug, performance
- **Lighthouse**: Performance audit
- **NVDA/VoiceOver**: Screen reader testing
- **BrowserStack**: Cross-browser testing (if available)
- **ResponsivelyApp**: Multi-device preview

### Design System Reference:
- **Colors**: [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- **Glassmorphism**: [CSS Glass Morphism Generator](https://hype4.academy/tools/glassmorphism-generator)
- **Animations**: [CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions)

---

## 🎯 Testing Tips

1. **Start with Critical**: Test critical cases first untuk ensure core functionality
2. **Use Real Data**: Test dengan realistic data (long names, edge cases)
3. **Test Edge Cases**: Don't just test happy path
4. **Cross-Browser**: Test di at least 2 browsers (Chrome + 1 other)
5. **Real Devices**: Test on actual mobile device jika possible
6. **Document Everything**: Screenshot, console errors, steps
7. **Be Thorough**: Check details (spacing, colors, animations)
8. **Think Like User**: Test dari perspective user yang baru

---

**Last Updated**: September 30, 2025
**Version**: v1.0
**Status**: Ready for Testing

---

*Happy Testing! 🧪✨*