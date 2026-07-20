<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import orderAPI from "@/services/orderAPI";
import customerAPI from "@/services/customerAPI";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";
import { useCurrency } from "@/composables/useCurrency";
import logger from "@/utils/logger";

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();
const authStore = useAuthStore();
const { format: fmt } = useCurrency();

const submitting = ref(false);
const errorMsg = ref("");
const orderNotes = ref("");
const successOrderId = ref<number | null>(null);
const discountCode = ref("");
const discountApplied = ref<any>(null);
const discountError = ref("");

const guestName = ref("");
const guestPhone = ref("");
const guestEmail = ref("");
const guestMode = computed(() => !authStore.isAuthenticated);

const preferences = ref<any>({});
const loadPreferences = async () => {
  try {
    const customerId = authStore.user?.id;
    if (!customerId) return;
    const res = await customerAPI.getProfile(customerId);
    if (res.data?.success && res.data?.customer) {
      preferences.value = res.data.customer.preferences || {};
    }
  } catch {
    preferences.value = {};
  }
};

const reservationId = computed(() =>
  route.query.reservationId ? Number(route.query.reservationId) : null
);

const subtotal = computed(() => cartStore.total);
const discountAmount = computed(() => {
  if (!discountApplied.value) return 0;
  const type = discountApplied.value.discountType;
  const value = parseFloat(discountApplied.value.discountValue || 0);
  if (type === "percentage") {
    return (subtotal.value * value) / 100;
  }
  return Math.min(value, subtotal.value);
});
const tax = computed(() => (subtotal.value - discountAmount.value) * 0.025);
const total = computed(() => subtotal.value - discountAmount.value + tax.value);

onMounted(async () => {
  cartStore.hydrate();
  await loadPreferences();
  if (!cartStore.count) {
    router.push("/menu");
  }
});

const applyDiscount = async () => {
  discountError.value = "";
  if (!discountCode.value.trim()) {
    discountError.value = "Enter a discount code.";
    return;
  }
  try {
    const res = await orderAPI.applyDiscount(
      0,
      "percentage",
      0,
      discountCode.value.trim()
    );
    if (res.data?.success && res.data?.order) {
      discountApplied.value = res.data.order;
    } else {
      discountError.value = "Invalid discount code.";
    }
  } catch {
    discountError.value = "Failed to apply discount.";
  }
};

const submitOrder = async () => {
  submitting.value = true;
  errorMsg.value = "";

  let customerId = authStore.user?.id || null;

  if (!customerId && guestMode.value) {
    if (!guestName.value || !guestPhone.value) {
      errorMsg.value = "Please enter your name and phone number.";
      submitting.value = false;
      return;
    }

    try {
      const res = await customerAPI.findOrCreate({
        firstName: guestName.value.trim(),
        lastName: "",
        phone: guestPhone.value.trim(),
        email: guestEmail.value.trim() || undefined,
      });
      customerId = res.data?.customer?.id || res.data?.id || null;
    } catch (err) {
      logger.error("Guest customer creation failed", { error: err });
      errorMsg.value = "Could not create customer record. Please try again.";
      submitting.value = false;
      return;
    }
  }

  if (!customerId) {
    errorMsg.value =
      "Unable to place order. Please log in or continue as guest.";
    submitting.value = false;
    return;
  }

  try {
    const items = cartStore.items.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice: item.price,
      selectedOptions: item.selectedOptions,
      itemNotes: item.itemNotes || null,
    }));

    const payload: any = {
      items,
      notes: orderNotes.value || null,
      createdBy: "customer",
      customerId,
    };

    if (reservationId.value) {
      payload.reservationId = reservationId.value;
    }

    if (discountApplied.value) {
      payload.discountType = discountApplied.value.discountType;
      payload.discountValue = discountApplied.value.discountValue;
      payload.discountCode = discountApplied.value.discountCode;
    }

    const res = await orderAPI.createOrder(payload);
    if (res.data?.success && res.data?.order?.id) {
      successOrderId.value = res.data.order.id;
      cartStore.clear();
    } else {
      errorMsg.value = "Order failed. Please try again.";
    }
  } catch (err) {
    logger.error("Checkout failed", { error: err });
    errorMsg.value = "Order failed. Please try again.";
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Checkout</h1>
        <p>Review your order before finalizing</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="successOrderId" class="success-state">
        <h2>Order Confirmed!</h2>
        <p>Your order #{{ successOrderId }} has been placed successfully.</p>
        <div class="success-actions">
          <button class="btn-primary" @click="router.push('/portal/orders')">
            View My Orders
          </button>
          <button class="btn-link" @click="router.push('/menu')">
            Back to Menu
          </button>
        </div>
      </div>

      <div v-else class="checkout-layout">
        <div class="checkout-items">
          <div v-if="guestMode" class="guest-box">
            <h3>Guest Details</h3>
            <div class="guest-grid">
              <div class="field">
                <label>Full name</label>
                <input v-model="guestName" placeholder="Your name" />
              </div>
              <div class="field">
                <label>Phone (WhatsApp)</label>
                <input v-model="guestPhone" placeholder="+233 24 000 0000" />
              </div>
              <div class="field">
                <label>Email (optional)</label>
                <input v-model="guestEmail" placeholder="you@example.com" />
              </div>
            </div>
            <p class="field-hint">
              We’ll create an account for you after checkout. No password
              needed.
            </p>
          </div>

          <h3>Order Summary</h3>
          <div
            v-for="(item, idx) in cartStore.items"
            :key="idx"
            class="summary-item"
          >
            <div class="summary-main">
              <b>{{ item.name }}</b>
              <span>Qty: {{ item.quantity }}</span>
            </div>
            <div class="summary-options" v-if="item.selectedOptions?.length">
              <span
                v-for="opt in item.selectedOptions"
                :key="opt.name"
                class="option-chip"
              >
                {{ opt.name }} (+{{ fmt(opt.priceAdjustment) }})
              </span>
            </div>
            <div class="summary-notes" v-if="item.itemNotes">
              Note: {{ item.itemNotes }}
            </div>
            <div class="summary-line">
              {{
                fmt(
                  (item.price +
                    (item.selectedOptions?.reduce(
                      (s, o) => s + o.priceAdjustment,
                      0
                    ) || 0)) *
                    item.quantity
                )
              }}
            </div>
          </div>

          <div v-if="Object.keys(preferences).length" class="preferences-box">
            <h4>Your Preferences</h4>
            <div v-if="preferences.dietaryRestrictions" class="pref-chips">
              <span
                v-for="pref in preferences.dietaryRestrictions"
                :key="pref"
                class="pref-chip warning"
              >
                {{ pref }}
              </span>
            </div>
            <div v-if="preferences.allergies" class="pref-chips">
              <span
                v-for="allergy in preferences.allergies"
                :key="allergy"
                class="pref-chip danger"
              >
                Allergy: {{ allergy }}
              </span>
            </div>
            <div
              v-if="!preferences.dietaryRestrictions && !preferences.allergies"
              class="pref-empty"
            >
              No dietary preferences set.
            </div>
          </div>
        </div>

        <div class="checkout-side">
          <div class="checkout-card">
            <h3>Totals</h3>
            <div class="totals">
              <div class="total-row">
                <span>Subtotal</span><span>{{ fmt(subtotal) }}</span>
              </div>
              <div v-if="discountAmount > 0" class="total-row discount">
                <span>Discount</span><span>-{{ fmt(discountAmount) }}</span>
              </div>
              <div class="total-row">
                <span>Tax (2.5%)</span><span>{{ fmt(tax) }}</span>
              </div>
              <div class="total-row total-final">
                <span>Total</span><span>{{ fmt(total) }}</span>
              </div>
            </div>

            <div class="discount-field">
              <label>Discount Code</label>
              <div class="discount-row">
                <input v-model="discountCode" placeholder="Enter code" />
                <button
                  class="btn-small"
                  @click="applyDiscount"
                  :disabled="!!discountApplied"
                >
                  Apply
                </button>
              </div>
              <div v-if="discountApplied" class="discount-success">
                Code "{{ discountApplied.discountCode }}" applied (-{{
                  fmt(discountAmount)
                }})
              </div>
              <div v-if="discountError" class="error-text">
                {{ discountError }}
              </div>
            </div>

            <div class="notes-field">
              <label>Kitchen Notes</label>
              <textarea
                v-model="orderNotes"
                rows="3"
                placeholder="Any allergies or special requests..."
              />
            </div>

            <button
              class="btn-place"
              :disabled="submitting || !cartStore.count"
              @click="submitOrder"
            >
              {{
                submitting ? "Placing Order…" : `Place Order · ${fmt(total)}`
              }}
            </button>
            <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-layout {
  display: flex;
  gap: var(--space-6);
}

.checkout-items {
  flex: 1;
}

.guest-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}

.guest-box h3 {
  margin: 0 0 var(--space-3) 0;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--ink);
}

.guest-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

@media (max-width: 640px) {
  .guest-grid {
    grid-template-columns: 1fr;
  }
}

.guest-box .field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.guest-box .field label {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-xs);
  color: var(--ink-secondary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.guest-box .field input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  outline: none;
  transition: border-color var(--duration-150) var(--ease-in-out),
    box-shadow var(--duration-150) var(--ease-in-out);
}

.guest-box .field input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.field-hint {
  margin-top: var(--space-2);
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-xs);
  color: var(--ink-muted);
}

.checkout-items h3,
.checkout-side h3 {
  margin: 0 0 var(--space-3) 0;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--ink);
}

.summary-item {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.summary-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-main b {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--ink);
}

.summary-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.option-chip {
  font-size: var(--text-xs);
  padding: var(--space-0-5) var(--space-1-5);
  border-radius: var(--radius-full);
  background: var(--neutral-100);
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  font-weight: 500;
}

.summary-notes {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  font-style: italic;
}

.summary-line {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--ink);
  text-align: right;
}

.preferences-box {
  margin-top: var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--space-4);
}

.preferences-box h4 {
  margin: 0 0 var(--space-2) 0;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--ink);
}

.pref-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.pref-chip {
  font-size: var(--text-xs);
  font-weight: 700;
  padding: var(--space-0-5) var(--space-2);
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.pref-chip.warning {
  background: linear-gradient(135deg, var(--accent-400), var(--accent-500));
  color: white;
}

.pref-chip.danger {
  background: linear-gradient(135deg, var(--rose-400), var(--rose-500));
  color: white;
}

.pref-empty {
  margin-top: var(--space-2);
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
  color: var(--ink-muted);
}

.checkout-side {
  width: 340px;
  flex-shrink: 0;
}

.checkout-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
  position: sticky;
  top: var(--space-4);
}

.totals {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}

.total-row.discount {
  color: var(--earth-600);
}

.total-final {
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--ink);
  border-top: 1px solid var(--border);
  padding-top: var(--space-2);
}

.discount-field {
  margin-bottom: var(--space-4);
}

.discount-field label {
  display: block;
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink);
  margin-bottom: var(--space-1);
}

.discount-row {
  display: flex;
  gap: var(--space-2);
}

.discount-row input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}

.discount-success {
  margin-top: var(--space-1);
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-xs);
  color: var(--earth-600);
}

.notes-field {
  margin-bottom: var(--space-4);
}

.notes-field label {
  display: block;
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink);
  margin-bottom: var(--space-1);
}

.notes-field textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  resize: vertical;
  transition: border-color var(--duration-150) var(--ease-in-out);
}

.notes-field textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.btn-place {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-in-out);
  box-shadow: var(--shadow-sm);
}

.btn-place:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-place:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-text {
  margin-top: var(--space-2);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--rose-600);
  text-align: center;
}

.success-state {
  text-align: center;
  padding: var(--space-10) var(--space-5);
}

.success-state h2 {
  margin: 0 0 var(--space-2) 0;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-2xl);
  color: var(--ink);
}

.success-state p {
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
}

.success-actions {
  margin-top: var(--space-4);
  display: flex;
  gap: var(--space-3);
  justify-content: center;
}

.btn-primary {
  padding: var(--space-2) var(--space-5);
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-in-out);
  box-shadow: var(--shadow-sm);
}

.btn-link {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--accent);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
}

.btn-small {
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-lg);
  background: var(--accent);
  color: white;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-in-out);
}

.btn-small:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .checkout-layout {
    flex-direction: column;
  }

  .checkout-side {
    width: 100%;
  }
}
</style>
