<template>
  <div class="customer-portal-event-detail-view">
    <div v-if="loading" class="event-detail-loading">Loading event...</div>
    <div v-else-if="!event" class="event-detail-missing">
      <p>Event not found or no longer available.</p>
      <RouterLink :to="{ name: 'customer-events' }" class="back-link">
        Back to events
      </RouterLink>
    </div>
    <div v-else class="event-detail">
      <div class="event-detail-header">
        <span class="event-date-badge">
          {{ formatDate(event.eventDate) }}
          <span v-if="event.startTime" class="event-time-badge">
            {{ event.startTime }}
          </span>
        </span>
        <span v-if="event.eventType" class="event-type-badge">
          {{ event.eventType }}
        </span>
      </div>

      <h1>{{ event.name }}</h1>

      <div class="event-meta">
        <p v-if="event.venue" class="event-venue">{{ event.venue }}</p>
        <p v-if="event.address" class="event-address">{{ event.address }}</p>
        <p v-if="event.capacity" class="event-capacity">
          Capacity: {{ event.capacity }}
        </p>
      </div>

      <div v-if="event.description" class="event-description">
        {{ event.description }}
      </div>

      <div v-if="checkoutStep === 'form' && event.isTicketed" class="checkout-section">
        <h2 class="checkout-title">Buy Tickets</h2>
        <form @submit.prevent="submitBooking" class="checkout-form">
          <div v-if="ticketTypes.length > 1" class="form-group">
            <label for="ticketType">Ticket Type</label>
            <select id="ticketType" v-model="form.ticketTypeId" required>
              <option value="">Select ticket type</option>
              <option v-for="ticket in ticketTypes" :key="ticket.id" :value="ticket.id">
                {{ ticket.name }} — {{ formatGhs(ticket.price) }} ({{ ticket.quantity - (ticket.soldCount || 0) }} left)
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="guestName">Full Name</label>
            <input id="guestName" v-model="form.guestName" type="text" required />
          </div>

          <div class="form-group">
            <label for="guestEmail">Email</label>
            <input id="guestEmail" v-model="form.guestEmail" type="email" required />
          </div>

          <div class="form-group">
            <label for="guestPhone">Phone</label>
            <input id="guestPhone" v-model="form.guestPhone" type="tel" />
          </div>

          <div class="form-group">
            <label for="quantity">Quantity</label>
            <input id="quantity" v-model="form.quantity" type="number" min="1" :max="maxQuantity" required />
          </div>

          <div v-if="total > 0" class="checkout-total">
            Total: {{ formatGhs(total) }}
          </div>

          <div class="checkout-actions">
            <button type="button" class="secondary-button" @click="checkoutStep = 'detail'">
              Cancel
            </button>
            <button type="submit" class="primary-button" :disabled="submitting">
              {{ submitting ? "Processing..." : "Proceed to Payment" }}
            </button>
          </div>
        </form>
      </div>

      <div v-else-if="checkoutStep === 'payment' && paymentUrl" class="checkout-section">
        <h2 class="checkout-title">Complete Payment</h2>
        <p class="checkout-subtitle">You are being redirected to Paystack...</p>
        <a :href="paymentUrl" target="_blank" rel="noopener" class="primary-button">
          Open Payment Page
        </a>
      </div>

      <div v-else-if="checkoutStep === 'success' && booking" class="checkout-section">
        <h2 class="checkout-title">Booking Confirmed</h2>
        <p class="checkout-subtitle">Your booking has been created successfully.</p>
        <div class="booking-reference">
          Booking Reference: <strong>{{ booking.id }}</strong>
        </div>
        <RouterLink :to="{ name: 'customer-events' }" class="secondary-button">
          Back to events
        </RouterLink>
      </div>

      <div v-else class="event-detail-actions">
        <RouterLink
          :to="{ name: 'customer-events' }"
          class="secondary-button"
        >
          Back to events
        </RouterLink>
        <button
          v-if="event.isTicketed"
          class="primary-button"
          @click="startCheckout"
        >
          Buy Tickets
        </button>
        <span v-else class="event-free-badge">Free Entry</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import eventPortalAPI from "@/services/eventPortalAPI";

interface Event {
  id: number;
  name: string;
  description?: string;
  eventType?: string;
  venue?: string;
  address?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  isTicketed: boolean;
  requiresApproval?: boolean;
  checkinEnabled?: boolean;
  metadata?: Record<string, any>;
  tenant?: { id: number; name: string; slug: string } | null;
}

interface TicketType {
  id: number;
  name: string;
  price: number;
  quantity: number;
  soldCount: number;
  currency?: string;
}

type CheckoutStep = "detail" | "form" | "payment" | "success";

const route = useRoute();
const event = ref<Event | null>(null);
const ticketTypes = ref<TicketType[]>([]);
const loading = ref(true);
const checkoutStep = ref<CheckoutStep>("detail");
const submitting = ref(false);
const paymentUrl = ref("");
const booking = ref<any>(null);

const form = ref({
  ticketTypeId: "",
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  quantity: 1,
});

const maxQuantity = ref(1);
const total = ref(0);

const loadEvent = async () => {
  loading.value = true;
  try {
    const eventId = Number(route.params.eventId);
    if (!eventId) return;
    const res = await eventPortalAPI.getPublicEvent(eventId);
    event.value = (res.data?.event || res.data) as Event;
    if (event.value?.isTicketed) {
      const ticketRes = await eventPortalAPI.getTicketTypes(eventId);
      const tickets = (ticketRes.data?.data || ticketRes.data || []) as TicketType[];
      ticketTypes.value = tickets;
      if (tickets.length > 0) {
        form.value.ticketTypeId = String(tickets[0].id);
        updateTotal(tickets[0]);
      }
    }
  } catch {
    event.value = null;
  } finally {
    loading.value = false;
  }
};

const updateTotal = (ticket: TicketType) => {
  const qty = form.value.quantity || 1;
  total.value = Number(ticket.price) * qty;
  maxQuantity.value = Math.max(1, ticket.quantity - (ticket.soldCount || 0));
};

const startCheckout = () => {
  if (!event.value) return;
  checkoutStep.value = "form";
};

const submitBooking = async () => {
  if (!event.value) return;
  submitting.value = true;
  try {
    const payload = {
      eventId: event.value.id,
      ticketTypeId: form.value.ticketTypeId ? Number(form.value.ticketTypeId) : null,
      quantity: form.value.quantity,
      guestName: form.value.guestName,
      guestEmail: form.value.guestEmail,
      guestPhone: form.value.guestPhone,
    };

    const res = await eventPortalAPI.createPublicBooking(payload);
    const createdBooking = res.data?.item || res.data;
    booking.value = createdBooking;

    if (total.value <= 0) {
      checkoutStep.value = "success";
      return;
    }

    const paymentRes = await eventPortalAPI.initializePublicBookingPayment(
      createdBooking.id,
      form.value.guestEmail
    );
    paymentUrl.value = paymentRes.data?.authorizationUrl || paymentRes.data?.authorization_url || "";
    checkoutStep.value = "payment";
  } catch {
    alert("Failed to create booking. Please try again.");
  } finally {
    submitting.value = false;
  }
};

const formatGhs = (amount: number) => {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

onMounted(() => {
  loadEvent();
});
</script>

<style scoped>
.customer-portal-event-detail-view {
  padding: var(--space-6);
  max-width: 800px;
  margin: 0 auto;
}
.event-detail-loading,
.event-detail-missing {
  text-align: center;
  padding: var(--space-8);
  color: var(--neutral-500);
}
.back-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
}
.event-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}
.event-date-badge {
  background: var(--primary-light);
  color: var(--primary);
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 13px;
}
.event-time-badge {
  margin-left: var(--space-2);
  font-weight: 500;
}
.event-type-badge {
  background: var(--neutral-100);
  color: var(--neutral-700);
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}
.event-detail h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 var(--space-4);
  color: var(--neutral-900);
}
.event-meta {
  margin-bottom: var(--space-4);
}
.event-meta p {
  margin: var(--space-1) 0;
  color: var(--neutral-600);
  font-size: 15px;
}
.event-description {
  line-height: 1.6;
  color: var(--neutral-700);
  margin-bottom: var(--space-6);
  white-space: pre-line;
}
.event-detail-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}
.checkout-section {
  margin-top: var(--space-6);
  padding: var(--space-6);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  background: var(--white);
}
.checkout-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 var(--space-2);
  color: var(--neutral-900);
}
.checkout-subtitle {
  color: var(--neutral-500);
  margin-bottom: var(--space-4);
}
.checkout-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-700);
}
.form-group input,
.form-group select {
  padding: 10px 14px;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  font-size: 14px;
}
.checkout-total {
  font-size: 18px;
  font-weight: 700;
  color: var(--neutral-900);
}
.checkout-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
.primary-button {
  padding: 12px 24px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.secondary-button {
  padding: 12px 24px;
  background: var(--white);
  color: var(--neutral-700);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.booking-reference {
  margin: var(--space-4) 0;
  font-size: 14px;
  color: var(--neutral-600);
}
</style>
