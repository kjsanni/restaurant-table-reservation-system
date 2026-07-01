# Session Changelog — Frontend & Backend UI Modernization

## Overview

This session modernized the restaurant table reservation system frontend to match a consistent design system (Inter font family, rounded cards, soft shadows, improved spacing, status chips, and spinner loading states). A backend bug preventing staff–table association lookups was also fixed.

### Completed Work (2026-07-01)

- Installed TypeScript ESLint parser for Vue component linting
- Fixed TableView.vue unsafe finally block (return before finally)
- Added table `price` field with DECIMAL(10,2) and validation
- Added payment `discount` field with DECIMAL(10,2) and validation
- Added table `parentTableId` for merged table hierarchy
- Created LoadingSpinner.vue, ErrorBanner.vue, PageHeader.vue components
- Verified all migrations with sequelize-cli

---

## Frontend Changes

### 1. TypeScript Deprecation Warning Fix
**File:** `front-end/jsconfig.json`
**Change:** Added `"ignoreDeprecations": "6.0"` to `compilerOptions`
**Reason:** `baseUrl` was showing deprecation warning that will become a hard error in TypeScript 7.0.

---

### 2. Admin Settings Page
**File:** `front-end/src/views/AdminSettingsView.vue`
**Before:** Basic toggle list rendering raw values; no save feedback.
**After:**
- Settings grouped by category (`Registration`, `Reservations`) into card sections
- Boolean settings use styled `ToggleSwitch` component
- Number settings use stepper input (− / +) with min/max/step limits and unit display
- Per-setting save status (Saving… / Saved) with auto-clear
- Quick Actions updated to an icon-card grid referencing `/staff/manage`, `/roles/manage`, `/groups/manage`, `/tables/manage`, `/audit-logs`, `/schedule`, `/heatmap`, `/admin/payments`

---

### 3. Floor Plan
**File:** `front-end/src/views/FloorPlanView.vue`
**Before:** Table grid sometimes stacked vertically; sidebar and plan compete for space; plain dashed borders.
**After:**
- Enforced side-by-side layout (`flex-direction: row`) with fixed-width sidebar and flex plan panel
- Sidebar renamed to `pending-card` list with avatar initials, meta lines, drag hint, and badge count
- Plan section uses `plan-grid` with consistent card sizing and rounded corners
- Legend converted to pill badges
- Soft shadows and hover transitions throughout
- Spinner added for loading state
- Safe vertical stack below `860px`; horizontal above

---

### 4. Calendar
**File:** `front-end/src/views/CalendarView.vue`
**Before:** Plain grid cells; generic popup states; hardcoded action buttons.
**After:**
- Month nav buttons restyled as rounded icon buttons with hover fill
- Day cells use softer borders, colored closed/holiday/hour badges
- Hover lift effect on clickable days
- Popup empty/closed states use icons + centered text blocks
- Action panel uses unified card styling with bold status colors
- Reserved names on tooltip text

---

### 5. Schedule
**File:** `front-end/src/views/ScheduleView.vue`
**Before:** Plain list rows; inline holiday text; export buttons at top.
**After:**
- Split into two section cards: **Weekly Hours** and **Holidays**
- Day rows become list items with slot badge and toggle switch
- Holidays section has header with **Add Holiday** action button
- Time inputs have focus rings and disabled states
- Export buttons grouped in an action bar above the cards
- Spinner loading state added

---

### 6. Table Management
**File:** `front-end/src/views/TableManagementView.vue`
**Before:** Flat bordered list; no staff assignment UI; only block/unblock.
**After:**
- Table cards in responsive grid (`260px` min) with left status border (green/red/gray)
- Card hover lift + soft shadow
- Header shows name + status chip + table ID
- Block button kept on all cards; **Assign Staff** button hidden when staff already assigned
- Assigned staff shown as removable chips with `×` unassign button
- Block/Unblock modal uses rounded card with textarea focus ring
- **Staff assignment modal** supports:
  - Listing available staff (not already assigned AND under 5-table limit)
  - Showing each staff member's current table count (`X/5`)
  - Unassign mode showing currently assigned staff with click-to-remove
- Added `table.users` lowercase fix for Sequelize association mapping

**New API usage:** `tableAPI.getWaitingStaff()`, `tableAPI.assignStaff()`, `tableAPI.unassignStaff()`

---

### 7. Payment Dashboard
**File:** `front-end/src/views/PaymentDashboardView.vue`
**Before:** Crisp header cards; plain select filters.
**After:**
- Summary cards restyled with icon content and subtle left indicator
- Bar chart uses rounded tracks with hover transitions
- Filter selects have focus rings
- Cards grouped inside a single dashboard container with consistent gaps

---

### 8. Audit Logs
**File:** `front-end/src/views/AuditLogView.vue`
**Before:** Plain bordered table with colored header.
**After:**
- Table wrapped in a white card with soft shadow
- `entityType` shown as a blue pill badge instead of raw text
- Striped rows replaced by hover highlight
- Empty state message added
- Spinner loading state

---

### 9. Role Management
**File:** `front-end/src/views/RoleManagementView.vue`
**Before:** Border-row layout; inline delete btn.
**After:**
- Card layout per role with header containing name, system badge, and action buttons
- Permissions displayed as capital pill badges (green = active)
- Modal uses `Inter-Bold` title, grouped inputs, and modern buttons
- Empty state message

---

### 10. Group Management
**File:** `front-end/src/views/GroupManagementView.vue`
**Before:** Border-row layout; member chips inline.
**After:**
- Group cards with separated header and meta sections
- Permissions as capital pill grid
- Members as removable chips with `×`
- Two modals: Create/Edit Group and Add User to Group
- Empty state message

---

### 11. Staff Management
**File:** `front-end/src/views/StaffManagementView.vue`
**Before:** Grid list block; no image/visual identity.
**After:**
- Staff cards in 2-column grid (see `breakpoint 640px`)
- Avatar initials with gradient background on each card header
- Checkbox permission grid with `accent-color` primary blue
- Modal with `Inter-Bold` title, focus-ring inputs, and bottom action bar
- Remove button styled as danger soft variant

---

### 12. Heatmap
**File:** `front-end/src/views/HeatmapView.vue`
**Before:** Raw grid with colored cells; simple legend.
**After:**
- Spinner loading state
- Cells are rounded with hover scale + blue border ring
- Count label shown inside cell when > 0
- Tooltip text on hover
- Legend displays actual count numbers inside color swatches
- Added defensive `Array.isArray` fallback for heatmap API response to prevent `heatmapData.find is not a function` crash

---

### 13. Reports & Export
**File:** `front-end/src/views/ReportView.vue`
**Before:** Inline filters; bordered metric cards.
**After:**
- Filters grouped in a labeled card with 2×2 grid on desktop
- Generate button with disabled state when loading
- Error state styled with icon and warning background
- Metrics use icon + metric pair cards (revenue gets green left border)
- Payment breakdown rendered as a clean list table with muted count badges

---

### 14. Waitlist
**File:** `front-end/src/views/WaitlistView.vue`
**Before:** Stat cards row at top; action buttons below; stacked layout.
**After:**
- Stats shown as 2×2 pill cards with icons and left accent borders on mobile, 4-up on desktop
- Actions grouped in an action bar
- Entries use card grid with guest avatar, name, party badge, info lines, and action footer
- Empty state with envelope icon
- Popup internally upgraded with modern `field-input` styling, focus rings, and consistent button palette

---

### 15. New Reservation
**File:** `front-end/src/views/NewReservationView.vue`
**Before:** Direct `<TextBox>` usage centered in bordered wrapper; generic button width.
**After:**
- Converted to native inputs with `Inter` styling and focus rings
- Fields grouped into **Guest Details** and **Reservation Details** cards
- Tags rendered as chips: active state fills with the tag's color, inactive shows hollow border
- Submit button uses primary blue with icon, hover lift, and shadow glow
- Reduced unnecessary wrapper centering constraints

---

### 16. Reservations
**Files:** `front-end/src/views/ReservationsView.vue`, `front-end/src/components/TheReservations.vue`
**Before:** Giant arrow navigation centered; stacked reservation + table panels.
**After:**
- Navigation replaced with small rounded icon buttons + **Today** button
- Layout split into side-by-side `section-card`s on desktop (`grid-template-columns: 1fr 1fr`)
- Reservation table and all-tables grid each live in their own card containers
- Intersection observer left intact for existing blur animation

---

### 17. Search
**File:** `front-end/src/views/SearchView.vue`, `front-end/src/components/TheSearch.vue`
**Before:** Raw search input in header; `Suspense` with `SearchSkeleton`; `ListContainer` passed both bound props.
**After:**
- Header holds title + modern search bar with search icon, dark focus ring, and clear (`×`) button when text exists
- Spinner loading state replaces skeleton pattern
- Results count badge shown above list
- Empty state with magnifying-glass icon
- Consistent page padding and typography

---

## Backend Changes

### 1. Sequelize Association Fix — User ↔ Table
**File:** `back-end/src/db/models/user.js`
**Change:** Added missing reverse association to `Table`:
```js
User.belongsToMany(models.table, {
  through: "table_staff",
  foreignKey: "userId",
  otherKey: "tableId",
});
```
**Reason:** Sequelize only generates `user.getTables()` when both `Table` and `User` declare `belongsToMany`. Without this, `tableDAO.assignStaffToTable()` threw `user.getTables is not a function` when checking 5-table limit per staff member.

---

## Design System Consistency Applied

Across all modernized pages:

- **Typography:** `Inter-Bold` headings, `Inter-Medium` labels, `Inter-Light` body text
- **Surface colors:** white cards on `light-pink` background; `#f0f0f0` borders; subtle box shadows
- **Status colors:**
  - `#22c55e` green (success, free)
  - `#ef4444` red (danger, occupied, blocked)
  - `#f59e0b` amber (warning, waiting)
  - `#3b82f6` blue (primary, info)
  - `#6c757d` gray (neutral, blocked)
- **Border radius:** `8px` buttons, `10px` cards, `12px` containers, `14px` modals
- **Inputs:** `8px`/`12px` radius, `#f0f0f0` border, `#3b82f6` focus ring with `rgba(59,130,246,0.15)` shadow
- **Loading:** Centralized spinner animation (`0.8s linear infinite`) in `#lighter-gray` ring with `#primary-blue` top
- **Modals:** Fixed overlay, white `<div>` card, `14px` radius, `24px` padding, `0.5` black overlay
- **Buttons:** `btn-primary` (blue), `btn-secondary` (light gray), `btn-danger` (soft red), `btn-outline` (transparent)

---

## New API Calls Introduced

| Feature | Methods |
|---------|---------|
| Staff count per table | `GET /tables/staff` |
| Assign staff to table | `POST /tables/:id/staff` |
| Unassign staff from table | `DELETE /tables/:id/staff/:userId` |
| Payment revenue time-series | `GET /payments/revenue/time-series` |
| Heatmap v2 | `GET /reservations/heatmap-v2` |
| Waitlist suggestion | `GET /waitlist/suggest/:tableId` |
| Auto-seat from waitlist | `POST /waitlist/:entryId/seat` |

---

## Known Remaining Issues (not introduced this session)

- `util yaml-js.js` missing module — backend dependency issue
- `Suspense is an experimental feature` — Vue runtime warning (no functional impact)
- `Booking a table is only available on the reservation date!` — backend business rule enforced during floor-plan drag-and-drop
- `ERR_BAD_RESPONSE 500` on waitlist — backend server error unrelated to frontend changes
- Duplicate `console.log` in `TheReservations.vue` (existing debug output)
