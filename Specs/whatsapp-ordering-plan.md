# WhatsApp Ordering — Plan

## Context

The system already sends WhatsApp notifications for reservations via `whatsapp.service.js` (Meta WhatsApp Business API). The request is to let customers **initiate and complete food orders entirely through WhatsApp**, without touching the web app.

Current assets:
- Outgoing WhatsApp text/template sends in `back-end/src/services/whatsapp.service.js:67` and `:40`
- Phone normalization for Ghana numbers in `back-end/src/services/whatsapp.service.js:89`
- Full menu, order, and payment system already exists under `/api/v1/menu`, `/api/v1/orders`, `/api/v1/payments`
- Customer records with phone lookup exist in `customer.controller.js`

Gap: no inbound WhatsApp webhook receiver, no conversational session state, and no WhatsApp-native menu/cart UX.

## Approach

Build a **minimum viable WhatsApp ordering channel** as a thin conversational layer on top of the existing menu/order/payment APIs. Prove it with one tracer-bullet flow: **browse menu → add to cart → checkout → receive payment link → order confirmation**.

### Phase 1 — Inbound webhook + session state
1. Add `/api/v1/whatsapp/inbound` route (no auth, webhook-verified) that receives Meta WhatsApp webhook events.
2. Create `whatsapp-order.service.js` that:
   - Verifies webhook signature using `WHATSAPP_APP_SECRET`
   - Parses inbound text/reply messages
   - Looks up or creates a `Customer` by phone
   - Stores conversation state in Redis keyed by `whatsapp:{phone}`:
     - `idle`, `browsing`, `customizing`, `cart_review`, `checkout`, `awaiting_payment`
   - Returns 200 immediately to Meta; processes asynchronously

### Phase 2 — Menu browsing via WhatsApp
3. Build menu formatter that sends:
   - Category list as numbered text
   - Item details with price in GHS
   - Option to add to cart by replying with item number
4. Implement state transitions:
   - `idle` → `send menu categories` → `browsing`
   - `browsing` → `show items in category` → `browsing`
   - `browsing` → `add item` → `customizing` (if item has options) or directly to cart

### Phase 3 — Cart + checkout
5. Cart session stored in Redis:
   - `whatsapp:cart:{phone}` → `{ items: [...], total, discountCode }`
   - Persist 24h TTL
6. Commands:
   - `cart` → show current cart with totals
   - `checkout` → create order via existing `order.service.js`, generate Paystack payment link, send link via WhatsApp
   - `cancel` → clear cart
   - `help` → show available commands

### Phase 4 — Payment + order confirmation
7. After Paystack payment succeeds, the existing webhook handler in `billing.controller.js` already updates `Order.paymentStatus`. Add:
   - WhatsApp push notification on `charge.success` with order status and ETA
   - Simple status query: `status` → look up latest order for phone, reply with status

### Phase 5 — Admin controls
8. Add tenant settings:
   - `whatsapp_ordering_enabled` (boolean)
   - `whatsapp_ordering_hours` (JSON: open/close times per day)
9. Frontend: toggle in tenant settings + order dashboard integration

## Key decisions

| Decision | Rationale |
|----------|-----------|
| Redis for cart/state | Fast TTL-backed store; BullMQ already uses Redis in this project |
| Text-only menus first | No template approval needed from Meta; lower initial friction |
| Reuse existing order/payment APIs | Avoid duplicating pricing, discount, and payment logic |
| Phone as session key | Already normalized in `whatsapp.service.js`; matches customer records |
| Stateless webhook handler | Respond 200 to Meta immediately; async processing prevents timeout |

## Files to modify

### Backend
- `back-end/src/routes/whatsapp.router.js` — new inbound webhook route
- `back-end/src/controllers/whatsapp.controller.js` — webhook verification + dispatch
- `back-end/src/services/whatsapp-order.service.js` — new conversation engine
- `back-end/src/services/whatsapp.service.js` — add `verifyWebhookSignature` helper
- `back-end/src/utils/server.js` — mount `/api/v1/whatsapp/inbound`
- `back-end/src/__tests__/whatsapp-order.test.js` — service + controller tests

### Frontend
- `front-end/src/views/admin/WhatsAppOrderingSettingsView.vue` — tenant toggle + hours config
- `front-end/src/router/index.js` — add route `/settings/whatsapp-ordering`
- `front-end/src/services/settingsAPI.js` — add `updateWhatsAppOrderingSettings` method

### Config
- `.env.example` — document `WHATSAPP_APP_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

## Out of scope

- **QR code ordering** — explicitly excluded per earlier session decision
- **Rich WhatsApp templates/interactive buttons** — Meta approval required; defer to Phase 2
- **Multi-language support** — English only for MVP
- **Order modifications via WhatsApp** — only new orders; existing orders must be managed in web app
- **WhatsApp group ordering** — single-user only

## Verification

1. `cd back-end && npm test` — must pass (includes new `whatsapp-order.test.js`)
2. `cd front-end && npm run lint && npm run build` — must pass
3. Manual webhook test: send Meta test event to `/api/v1/whatsapp/inbound`, verify 200 response and Redis state update
4. Manual E2E: send "menu" to WhatsApp number → receive categories → select item → checkout → receive Paystack link → confirm order

## STOP conditions

- Meta WhatsApp Business API credentials are not configured (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`)
- Tenant does not have a verified WhatsApp Business number
- Redis is unavailable (BullMQ already depends on Redis; if Redis is down, this feature cannot function)
- Meta template approval is required for structured messages (text-only flow does not need approval)
