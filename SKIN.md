# SKIN.md — Professional UI/UX Skin Analysis

## Design Read

Reading this as: **multi-portal B2B SaaS platform for Ghanaian restaurant and salon operators**, with a **premium trust-forward** language, leaning toward a **warm neutral base with singular amber/earth accent** and **distinctive motion per portal**.

---

## Creative Foundation

### Chosen Foundation
**Organic Fluidity** for customer-facing surfaces, **Cinematic Pacing** for super-admin analytics, and **Editorial Brutalism** for tenant operational dashboards.

### Rationale
- **Customer portal** must feel welcoming and hospitality-native; soft surfaces, rounded corners, and warm motion match restaurant/salon environments.
- **Super-admin** is a control tower; cinematic pacing with restrained motion and generous negative space signals authority and calm oversight.
- **Tenant dashboard** is a daily workhorse; editorial brutalism gives it structural clarity, strong typographic hierarchy, and no decorative noise.

### Typographic Scale
| Role | Font | Scale |
|---|---|---|
| Display / Marketing | `Fraunces` | `clamp(2.5rem, 5vw, 4.5rem)` |
| Headings / UI | `Public Sans` | `clamp(1.25rem, 2vw, 2rem)` |
| Body | `Public Sans` | `0.9375rem` / `1.5625rem` line-height |
| Mono / Data | `JetBrains Mono` | `0.8125rem` / `1.4rem` line-height |

### Spacing Rhythm
Base unit `4px`. Section padding: `clamp(2rem, 4vw, 4rem)`. Card gap: `1.25rem`. Sidebar width: `260px` fixed.

### Surface Language
- Light mode default with warm off-white (`#fdfbf8`) page background.
- Cards: white with `border: 1px solid rgba(0,0,0,0.06)` and `border-radius: 14px`.
- Elevated surfaces use warm-tinted shadows (`rgba(26,20,16,0.08)`).
- No pure black text; ink = `#312e2a`.

---

## Brand Tokens

### Primary Palette
| Token | Value | Role |
|---|---|---|
| `--brand-50` | `#faf6f3` | Subtle backgrounds |
| `--brand-100` | `#f3ece6` | Hover states |
| `--brand-200` | `#e6d9cd` | Borders, dividers |
| `--brand-500` | `#a67c52` | Mid-tone accents |
| `--brand-700` | `#78543a` | Primary buttons, links |
| `--brand-900` | `#1a1410` | Sidebar, dark surfaces |

### Accent Palette
| Token | Value | Role |
|---|---|---|
| `--accent-50` | `#fffbeb` | Light alert backgrounds |
| `--accent-100` | `#fef3c7` | Badge backgrounds |
| `--accent-400` | `#f59e0b` | Highlights, active states |
| `--accent-500` | `#d97706` | Primary CTA |
| `--accent-600` | `#b45309` | Hover CTA |

### Semantic Tokens
| Token | Value | Usage |
|---|---|---|
| `--success` | `--earth-500` (#65a30d) | Positive states |
| `--info` | `--sky-500` (#3b82f6) | Informational |
| `--danger` | `--rose-500` (#f43f5e) | Errors, destructive |
| `--warning` | `--accent-400` (#f59e0b) | Caution states |
| `--surface` | `#ffffff` | Card backgrounds |
| `--background` | `--neutral-50` (#faf9f7) | Page background |
| `--ink` | `--neutral-900` (#312e2a) | Primary text |

### Portal-Specific Overrides
| Portal | Sidebar bg | Header treatment |
|---|---|---|
| Super-Admin | `--brand-900` solid | No topbar; sidebar-only |
| Tenant | `linear-gradient(180deg, var(--brand-900), #120e0b)` | Sticky topbar with blur |
| Customer | Transparent / minimal | No persistent sidebar; bottom nav on mobile |

---

## Asset Manifest

### Required Image Assets
| Asset | Purpose | Spec | Prompt Direction |
|---|---|---|---|
| `logo.svg` | Primary brand mark | SVG, 512x512 viewBox | Monogram "V" for Vibespot, geometric, warm amber on deep brown |
| `logo-icon.svg` | Favicon, sidebar icon | SVG, 64x64 | Simplified logo mark |
| `super-admin-hero.jpg` | Super-admin login / marketing | 1920x1080, cinematic | Dark tech environment, warm amber glow, data visualization aesthetic |
| `tenant-hero.jpg` | Tenant onboarding landing | 1920x1080, hospitality | Warm restaurant interior, golden hour lighting, shallow depth of field |
| `customer-hero.jpg` | Customer booking landing | 1920x1080, lifestyle | Fresh food photography or salon interior, bright and inviting |
| `texture-grain.png` | Ambient noise overlay | 256x256, tileable | Subtle paper grain, opacity 0.03-0.05 |
| `sidebar-pattern.svg` | Sidebar texture | SVG pattern | Geometric dot grid, brand-900 base, brand-500 dots at 8% opacity |

### Asset Generation Prompts
```
Super-admin hero: "Dark cinematic data visualization environment, 
warm amber glow on deep charcoal, subtle grid lines, premium 
control tower aesthetic, no people, 8k render"

Tenant hero: "Warm hospitality interior, golden hour light streaming 
through window, shallow depth of field, bokeh, cozy restaurant or 
salon setting, premium lifestyle photography"

Customer hero: "Fresh modern restaurant interior or salon station, 
bright natural light, inviting atmosphere, shallow depth of field, 
food or beauty context, warm tones"
```

---

## Motion Strategy

### Motion Tokens
| Token | Value | Usage |
|---|---|---|
| `--ease-enter` | `cubic-bezier(0.22, 1, 0.36, 1)` | Page transitions, modals, drawers |
| `--ease-move` | `cubic-bezier(0.25, 1, 0.5, 1)` | Slides, panels, side navigation |
| `--ease-spring` | `spring(0.6, 0.15)` | Interactive elements, drag physics |
| `--duration-fast` | `150ms` | Buttons, toggles, badges |
| `--duration-normal` | `250ms` | Cards, dropdowns, popovers |
| `--duration-slow` | `400ms` | Page transitions, overlays |

### Portal-Specific Motion Intensity
| Portal | Intensity | Character |
|---|---|---|
| Super-Admin | 3/10 | Restrained, data-focused. Staggered table rows on load. Smooth chart transitions only. |
| Tenant | 6/10 | Fluid and productive. Card hover lifts, sidebar collapse slides, skeleton loaders with shimmer. |
| Customer | 8/10 | Delightful and hospitality-forward. Hero parallax, staggered feature reveals, smooth page transitions. |

### Animation Catalog
1. **Page Transitions** — Fade + subtle slide (`translateY(8px)` → `0`) using `--ease-enter` at `--duration-normal`.
2. **Card Interactions** — `translateY(-2px)` + shadow expansion on hover; `scale(0.98)` on active.
3. **Sidebar Collapse** — Width transition at `--duration-slow` with `--ease-move`; content crossfade.
4. **Loading States** — Skeleton screens matching final layout shape; shimmer using CSS gradient animation.
5. **Toast Notifications** — Slide in from top-right, staggered queue; exit with fade + `translateX`.
6. **Modal/Drawer** — Backdrop fade (`opacity 0→1` at `--duration-normal`); panel scale from `0.95→1` with `--ease-enter`.
7. **Data Tables** — Row entrance stagger (`30ms` delay increment) on data load.
8. **Charts** — Animate series on mount using chart library native animation or CSS clip-path reveal.

### Accessibility
- All animations respect `prefers-reduced-motion: reduce`.
- Hover-only effects gated behind `@media (hover: hover)`.
- No `window.addEventListener("scroll")`; use Motion `useScroll()` or IntersectionObserver.

---

## Phase 0: Auth & High-Impact Surfaces

These are the first things users see. They must match the mockup quality or the skin fails.

### Login / Logout
- [ ] **Three distinct login experiences:** super-admin (dark cinematic), tenant (warm brand gradient), customer (welcoming hospitality). Do not reuse one generic login view.
- [ ] **Hero imagery:** each login gets a full-bleed background image or cinematic gradient with grain texture overlay. Super-admin uses dark tech environment; tenant uses warm hospitality interior; customer uses bright lifestyle/food photography.
- [ ] **Entry animations:** brand mark fades down, headline fades up, form card fades in with stagger. Use `--ease-enter` and `--duration-normal`.
- [ ] **Form treatment:** floating labels or clear top labels with `0.8125rem` uppercase tracking. Input focus state uses brand accent with `box-shadow` ring. Submit button is full-width gradient with hover lift.
- [ ] **Logout flow:** clicking logout opens a confirmation modal with backdrop blur + scale animation. No silent redirects.
- [ ] **TOTP / 2FA screen:** inherits the same brand side treatment as the parent login view. Do not drop to a plain white page.

### Modals & Overlays
- [ ] **Backdrop:** `rgba(0,0,0,0.4)` with `backdrop-filter: blur(8px)`. Fade in at `--duration-normal`.
- [ ] **Panel entrance:** scale from `0.95` to `1` + fade from `0` to `1` using `--ease-enter`. Duration `250ms`.
- [ ] **Close animation:** reverse of open — scale to `0.95` + fade out at `150ms` using exit curve.
- [ ] **Sizing:** default modal `max-width: 480px`, full-screen only for data-heavy tables. Never exceed `600px` width for forms.
- [ ] **Z-index scale:** `--z-modal: 200`, `--z-toast: 300`. Toast notifications slide in from top-right, queue with stagger, exit with fade + translate.
- [ ] **Focus trap:** modals must trap focus and close on `Escape`. Do not ship a modal without keyboard support.

### Buttons & CTAs
- [ ] **Primary:** gradient background (`brand-700` → `brand-900`), white text, `border-radius: 10px`, hover lift `translateY(-1px)` + shadow expansion.
- [ ] **Secondary:** white background, brand border, hover fills with `brand-50`.
- [ ] **Danger:** `rose-500` background, white text, hover `rose-600`.
- [ ] **Sizes:** `sm` (32px height), `md` (40px height), `lg` (48px height). Button text must fit on one line at desktop.
- [ ] **Loading state:** button shows spinner + "Signing in..." text, disabled state prevents double-submit.

### Empty States & Error Pages
- [ ] **Empty state:** centered illustration or icon, short headline, single CTA. No "There are no items" without a suggested action.
- [ ] **404 / Not Found:** brand-colored illustration, "Page not found" headline, back-to-dashboard link. Keep it minimal.
- [ ] **Error boundary:** friendly message, technical details in collapsible section, retry button.

---

## Implementation Checklist

### Phase 1: Token Unification
- [ ] Audit all hardcoded hex values across `src/views/**/*.vue` and `src/components/**/*.vue`.
- [ ] Replace every hardcoded color with a CSS custom property reference or design-token alias.
- [ ] Unify `base.css` and `colors.js` into a single source of truth; generate JS tokens from CSS custom properties at build time.
- [ ] Ensure `useTenantBranding.js` overrides the full brand token set, not just brand-500 through brand-900.

### Phase 2: Layout Consistency
- [ ] Add sticky topbar to `SuperAdminLayout.vue` matching TenantLayout height/blur treatment.
- [ ] Standardize sidebar header: use SVG logo mark for both layouts, with `.sidebar-header .logo` and `.sidebar-header .brand` selectors.
- [ ] Create `CustomerLayout.vue` with bottom navigation on mobile and minimal top nav on desktop.
- [ ] Fix salon route gating: filter `tenantNavItems` by `businessVertical` so restaurant tenants never see salon nav items.

### Phase 3: Component Skin
- [ ] Apply `border-radius: 14px` and warm-tinted shadows to all card components.
- [ ] Update `design-system.css` utility classes to reference new token names.
- [ ] Replace Vuestic default colors with brand token overrides in `main.ts`; eliminate dual-source-of-truth.
- [ ] Add `texture-grain.png` as a fixed `pointer-events-none` overlay on body for ambient texture.

### Phase 4: Typography & Imagery
- [ ] Verify Google Fonts loading in all `index.*.html` files; add `JetBrains Mono` if not present.
- [ ] Replace `Fraunces` display usage with the new typographic scale; reserve serif for marketing/customer surfaces only.
- [ ] Generate and insert `logo.svg`, `logo-icon.svg`, and portal hero images per Asset Manifest.
- [ ] Update all `<img>` logo references to use the new SVG logo with proper `alt` text.

### Phase 5: Motion
- [ ] Add page transition wrapper using `--ease-enter` and `--duration-normal`.
- [ ] Implement skeleton loaders for all list/table views.
- [ ] Add stagger animation to table rows, card grids, and menu items.
- [ ] Wire up Lenis smooth scroll for customer portal; GSAP ScrollTrigger for super-admin analytics dashboards.
- [ ] Add `prefers-reduced-motion` media query to disable all transform animations.

### Phase 6: Vertical Differentiation

#### Restaurant Verticals
| Vertical | UI Character | Key Screens | Accent Emphasis |
|---|---|---|---|
| Cloud kitchen | Dark, operational, delivery-first | Order management, rider dispatch, inventory | High-contrast amber for status urgency |
| Dine-in/takeaway | Balanced, reservation + POS hybrid | Table map, split receipt, queue | Brand-500 for dine-in, accent-500 for takeaway |
| Full restaurant | Premium, comprehensive, all-modules | Reservations, events, banqueting, analytics | Brand-700 for authority, gold accents for VIP |
| Cafe | Light, casual, quick-service | Walk-in queue, menu boards, loyalty | Earth-500 for warmth, minimal chrome |
| Bar | Evening/moody, night-mode native | Reservations, tab management, events | Rose-500 for evening energy, dark surfaces |

#### Salon Verticals
| Vertical | UI Character | Key Screens | Accent Emphasis |
|---|---|---|---|
| Barbers (male) | Clean, sharp, efficient | Service menu, waitlist, Barber chair schedule | Sky-500 for trust, minimal decoration |
| Barbers (female) | Polished, detail-oriented | Styling consultation, color picker, gallery | Rose-500 for beauty context |
| Barbers (unisex | Neutral, inclusive, split-service | Combined service menu, dual-chair schedule | Brand-500 neutral |
| Dreadlocks salon | Cultural, textured, educational | Treatment tracker, product guide, gallery | Earth-500 for natural tones |
| Nail salon | Visual, gallery-heavy, appointment | Before/after gallery, color picker, booking | Accent-400 for playful energy |
| Spa | Relaxing, wellness, package-heavy | Treatment menu, therapist assignment, packages | Earth-500 + rose-300 for calm |
| Hair dressers | Creative, portfolio-driven | Lookbook, color consultation, stylist assignment | Brand-500 + accent-400 for creativity |
| Full boutiques | Comprehensive, multi-service hub | Unified service catalog, cross-department booking | Full palette, brand-700 as anchor |

### Phase 7: Accessibility & Performance
- [ ] Run contrast checks on all text/background combinations; ensure WCAG AA minimum.
- [ ] Audit `z-index` usage; establish a scale (`--z-base: 0`, `--z-dropdown: 100`, `--z-modal: 200`, `--z-toast: 300`).
- [ ] Verify all animations use `transform` and `opacity` only.
- [ ] Test in both light and dark modes if dark mode is added later.

---

## Anti-Patterns to Avoid

- **No generic purple gradients.** The brand is warm amber/earth. Purple appears nowhere.
- **No centered hero on landing pages.** Use split-screen or asymmetric layouts (`DESIGN_VARIANCE: 8`).
- **No Inter as primary font.** `Public Sans` is the UI workhorse; `Fraunces` is display-only.
- **No hardcoded hex in components.** Every value traces to a token.
- **No infinite-loop micro-animations on high-frequency elements.** Motion is purposeful, not decorative.
- **No mixed card corner radii.** Lock to `14px` for the entire surface system.
