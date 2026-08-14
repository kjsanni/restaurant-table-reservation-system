<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import eventPortalAPI from "@/services/eventPortalAPI";
import logger from "@/utils/logger";

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
  status: string;
  isTicketed: boolean;
}

interface TicketType {
  id: number;
  name: string;
  description?: string;
  price: string;
  currency: string;
  quantity: number;
  soldCount: number;
  isActive: boolean;
}

interface Booking {
  id: number;
  eventId: number;
  ticketTypeId: number | null;
  quantity: number;
  unitPrice: string;
  total: string;
  status: string;
  paymentStatus: string;
  paymentReference: string | null;
  bookedAt: string;
  currency?: string;
  ticketType?: TicketType;
  event?: Event;
}

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const eventId = computed(() => Number(route.params.id));
const event = ref<Event | null>(null);
const ticketTypes = ref<TicketType[]>([]);
const loading = ref(true);
const booking = ref<Booking | null>(null);
const showBookingForm = ref(false);
const selectedTicketType = ref<TicketType | null>(null);
const quantity = ref(1);
const guestName = ref("");
const guestEmail = ref("");
const guestPhone = ref("");
const notes = ref("");
const submitting = ref(false);
const paymentLoading = ref(false);
const errorMessage = ref("");
const showConfirmation = ref(false);
const confirmedBooking = ref<Booking | null>(null);

const loadEvent = async () => {
  loading.value = true;
  try {
    const [eventRes, ticketsRes] = await Promise.all([
      eventPortalAPI.getEvent(eventId.value),
      eventPortalAPI.getTicketTypes(eventId.value),
    ]);
    event.value = (eventRes.data?.item || eventRes.data) as Event;
    ticketTypes.value = (ticketsRes.data?.rows ||
      ticketsRes.data ||
      []) as TicketType[];
  } catch (err) {
    logger.error("Failed to load event", { error: err });
  } finally {
    loading.value = false;
  }
};

const availableTickets = computed(() => {
  return ticketTypes.value.filter((t) => t.isActive);
});

const ticketAvailability = (ticket: TicketType) => {
  const remaining = ticket.quantity - ticket.soldCount;
  if (remaining <= 0) return "Sold out";
  if (remaining <= 5) return `Only ${remaining} left`;
  return `${remaining} available`;
};

const availabilityClass = (ticket: TicketType) => {
  const remaining = ticket.quantity - ticket.soldCount;
  if (remaining <= 0) return "t-sold-out";
  if (remaining <= 5) return "t-limited";
  return "t-available";
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "TBD";
  const dt = new Date(dateStr + "T00:00:00");
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (timeStr?: string) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${String(minutes).padStart(2, "0")} ${period}`;
};

const goBack = () => {
  router.push("/portal/events");
};

const openBookingForm = (ticket: TicketType) => {
  const remaining = ticket.quantity - ticket.soldCount;
  if (remaining <= 0) return;
  selectedTicketType.value = ticket;
  quantity.value = 1;
  guestName.value = authStore.user?.name || "";
  guestEmail.value = authStore.user?.email || "";
  guestPhone.value = "";
  notes.value = "";
  errorMessage.value = "";
  showBookingForm.value = true;
};

const closeBookingForm = () => {
  showBookingForm.value = false;
  selectedTicketType.value = null;
};

const submitBooking = async () => {
  if (!selectedTicketType.value) return;
  submitting.value = true;
  errorMessage.value = "";
  try {
    const payload = {
      eventId: eventId.value,
      ticketTypeId: selectedTicketType.value.id,
      quantity: quantity.value,
      guestName: guestName.value || undefined,
      guestEmail: guestEmail.value || undefined,
      guestPhone: guestPhone.value || undefined,
      notes: notes.value || undefined,
    };
    const res = await eventPortalAPI.createBooking(payload);
    booking.value = res.data?.item || res.data;
    closeBookingForm();
    await initiatePayment();
  } catch (err) {
    errorMessage.value =
      err?.response?.data?.message || "Failed to create booking";
  } finally {
    submitting.value = false;
  }
};

const initiatePayment = async () => {
  if (!booking.value) return;
  paymentLoading.value = true;
  try {
    const email = guestEmail.value || authStore.user?.email;
    if (!email) {
      throw new Error("Email is required for payment");
    }
    const res = await eventPortalAPI.initializePayment(
      booking.value!.id,
      email
    );
    const data = res.data;
    if (data?.authorizationUrl) {
      const returnUrl = `${window.location.origin}/portal/events/${eventId.value}?paid=true&booking=${booking.value.id}`;
      const paystackUrl = new URL(data.authorizationUrl);
      paystackUrl.searchParams.set("callback_url", returnUrl);
      window.location.href = paystackUrl.toString();
    } else {
      throw new Error("Payment initialization failed");
    }
  } catch (err) {
    errorMessage.value =
      err?.response?.data?.message || "Payment initialization failed";
  } finally {
    paymentLoading.value = false;
  }
};

const checkPostPayment = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const paid = urlParams.get("paid");
  const bookingId = urlParams.get("booking");
  if (paid === "true" && bookingId) {
    try {
      const res = await eventPortalAPI.getBooking(Number(bookingId));
      confirmedBooking.value = res.data?.item || res.data;
      showConfirmation.value = true;
      window.history.replaceState({}, "", `/portal/events/${eventId.value}`);
    } catch (err) {
      logger.error("Failed to load booking after payment", { error: err });
    }
  }
};

const viewWalletPass = () => {
  router.push(`/portal/events/${eventId.value}/wallet-pass`);
};

const backToEvent = () => {
  showConfirmation.value = false;
  confirmedBooking.value = null;
};

onMounted(async () => {
  await loadEvent();
  await checkPostPayment();
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <button class="back-btn" @click="goBack" aria-label="Back to events">
          <span class="mdi mdi:arrow-left"></span>
          Back
        </button>
        <div>
          <h1 v-if="event">{{ event.name }}</h1>
          <p v-if="event">{{ event.venue || "Event Details" }}</p>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="state">Loading…</div>
      <div v-else-if="!event" class="state">Event not found.</div>
      <template v-else>
        <div class="event-hero">
          <div class="event-hero-header">
            <div>
              <span :class="['status-pill', `t-${event.status}`]">
                {{ event.status }}
              </span>
              <span v-if="event.eventType" class="event-type-badge">
                {{ event.eventType }}
              </span>
              <span v-if="event.isTicketed" class="ticket-badge">Ticketed</span>
            </div>
          </div>
          <div class="event-details">
            <div class="detail-row">
              <span class="mdi mdi:calendar"></span>
              <div>
                <strong>Date</strong>
                <p>{{ formatDate(event.eventDate) }}</p>
              </div>
            </div>
            <div v-if="event.startTime || event.endTime" class="detail-row">
              <span class="mdi mdi:clock"></span>
              <div>
                <strong>Time</strong>
                <p>
                  {{ formatTime(event.startTime) }}
                  <span v-if="event.endTime">
                    - {{ formatTime(event.endTime) }}
                  </span>
                </p>
              </div>
            </div>
            <div v-if="event.venue" class="detail-row">
              <span class="mdi mdi:map-marker"></span>
              <div>
                <strong>Venue</strong>
                <p>{{ event.venue }}</p>
              </div>
            </div>
            <div v-if="event.address" class="detail-row">
              <span class="mdi mdi:map"></span>
              <div>
                <strong>Address</strong>
                <p>{{ event.address }}</p>
              </div>
            </div>
            <div v-if="event.capacity" class="detail-row">
              <span class="mdi mdi:account-group"></span>
              <div>
                <strong>Capacity</strong>
                <p>{{ event.capacity }}</p>
              </div>
            </div>
          </div>
          <p v-if="event.description" class="event-description">
            {{ event.description }}
          </p>
        </div>

        <div v-if="availableTickets.length" class="tickets-section">
          <h2>Ticket Types</h2>
          <div class="tickets-list">
            <div
              v-for="ticket in availableTickets"
              :key="ticket.id"
              class="ticket-card"
            >
              <div class="ticket-header">
                <h3>{{ ticket.name }}</h3>
                <span
                  :class="['availability-badge', availabilityClass(ticket)]"
                >
                  {{ ticketAvailability(ticket) }}
                </span>
              </div>
              <p v-if="ticket.description" class="ticket-description">
                {{ ticket.description }}
              </p>
              <div class="ticket-footer">
                <span class="ticket-price">
                  {{
                    ticket.price === "0.00" || ticket.price === "0"
                      ? "Free"
                      : `${ticket.currency} ${Number(ticket.price).toFixed(2)}`
                  }}
                </span>
                <span class="ticket-quantity">
                  {{ ticket.soldCount }} / {{ ticket.quantity }} sold
                </span>
              </div>
              <button
                class="book-btn"
                :disabled="ticket.quantity - ticket.soldCount <= 0"
                @click="openBookingForm(ticket)"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>

        <div class="wallet-pass-section">
          <h2>Digital Wallet Pass</h2>
          <div class="wallet-pass-card">
            <div class="wallet-pass-header">
              <span
                class="mdi mdi:wallet-gift-card"
                style="font-size: 24px; color: var(--brand-600)"
              ></span>
              <div>
                <h3>Add to Apple Wallet, Google Pay, Samsung Pay</h3>
                <p class="wallet-pass-subtitle">
                  Save your ticket to your phone's wallet app for easy entry at
                  the gate.
                </p>
              </div>
            </div>
            <button
              class="wallet-pass-btn"
              @click="
                router.push(`/portal/events/${eventId.value}/wallet-pass`)
              "
            >
              Manage Wallet Pass
            </button>
          </div>
        </div>
      </template>

      <div
        v-if="showConfirmation && confirmedBooking"
        class="confirmation-section"
      >
        <div class="confirmation-card">
          <div class="confirmation-header">
            <span
              class="mdi mdi:check-circle"
              style="font-size: 48px; color: #16a34a"
            ></span>
            <h2>Payment Successful!</h2>
          </div>
          <p class="confirmation-message">
            Your ticket for {{ event?.name }} has been confirmed.
          </p>
          <div class="confirmation-details">
            <div class="detail-row">
              <strong>Booking ID</strong>
              <p>#{{ confirmedBooking.id }}</p>
            </div>
            <div class="detail-row">
              <strong>Tickets</strong>
              <p>
                {{ confirmedBooking.quantity }} x
                {{ confirmedBooking.ticketType?.name || "Ticket" }}
              </p>
            </div>
            <div class="detail-row">
              <strong>Total Paid</strong>
              <p>
                {{ confirmedBooking.currency || "GHS" }}
                {{ Number(confirmedBooking.total || 0).toFixed(2) }}
              </p>
            </div>
          </div>
          <div class="confirmation-actions">
            <button class="wallet-pass-btn" @click="viewWalletPass">
              View Wallet Pass
            </button>
            <button class="secondary" @click="backToEvent">
              Back to Event
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showBookingForm"
      class="modal-overlay"
      @click.self="closeBookingForm"
    >
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Book ticket"
      >
        <h3>Book {{ selectedTicketType?.name }}</h3>
        <p v-if="selectedTicketType" class="modal-price">
          {{
            selectedTicketType.price === "0.00" ||
            selectedTicketType.price === "0"
              ? "Free"
              : `${selectedTicketType.currency} ${Number(selectedTicketType.price).toFixed(2)}`
          }}
        </p>
        <div class="form-group">
          <label for="quantity">Quantity</label>
          <input
            id="quantity"
            type="number"
            min="1"
            :max="
              selectedTicketType
                ? selectedTicketType.quantity - selectedTicketType.soldCount
                : 1
            "
            v-model.number="quantity"
          />
        </div>
        <div class="form-group">
          <label for="guestName">Full Name</label>
          <input id="guestName" v-model="guestName" />
        </div>
        <div class="form-group">
          <label for="guestEmail">Email</label>
          <input id="guestEmail" type="email" v-model="guestEmail" />
        </div>
        <div class="form-group">
          <label for="guestPhone">Phone</label>
          <input id="guestPhone" v-model="guestPhone" />
        </div>
        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea id="notes" v-model="notes"></textarea>
        </div>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <div class="modal-actions">
          <button class="secondary" @click="closeBookingForm">Cancel</button>
          <button
            class="primary"
            :disabled="submitting || paymentLoading"
            @click="submitBooking"
          >
            {{
              submitting || paymentLoading
                ? "Processing…"
                : "Continue to Payment"
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--neutral-700);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: var(--space-3);
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}
.back-btn:hover {
  background: var(--neutral-50);
  border-color: var(--neutral-300);
}
.event-hero {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
}
.event-hero-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}
.event-hero-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--neutral-900);
}
.event-type-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px var(--space-3);
  border-radius: 999px;
  background: var(--neutral-100);
  color: var(--neutral-700);
}
.ticket-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px var(--space-3);
  border-radius: 999px;
  background: var(--brand-50);
  color: var(--brand-700);
}
.event-details {
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.detail-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--neutral-100);
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-row .mdi {
  color: var(--neutral-400);
  font-size: 20px;
  margin-top: 2px;
}
.detail-row strong {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}
.detail-row p {
  margin: 0;
  font-size: 15px;
  color: var(--neutral-900);
}
.event-description {
  color: var(--neutral-600);
  line-height: 1.6;
  margin: 0;
}
.tickets-section {
  margin-top: var(--space-8);
}
.wallet-pass-section {
  margin-top: var(--space-8);
}
.confirmation-section {
  margin-top: var(--space-8);
}
.confirmation-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  text-align: center;
}
.confirmation-header {
  margin-bottom: var(--space-4);
}
.confirmation-header h2 {
  margin: var(--space-3) 0 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--neutral-900);
}
.confirmation-message {
  color: var(--neutral-600);
  margin-bottom: var(--space-6);
}
.confirmation-details {
  text-align: left;
  margin-bottom: var(--space-6);
}
.confirmation-details .detail-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--neutral-100);
}
.confirmation-details .detail-row:last-child {
  border-bottom: none;
}
.confirmation-details strong {
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.confirmation-details p {
  margin: 0;
  font-size: 15px;
  color: var(--neutral-900);
}
.confirmation-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
}
.confirmation-actions .wallet-pass-btn {
  flex: 1;
}
.confirmation-actions .secondary {
  flex: 1;
}
.wallet-pass-card {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  background: var(--white);
}
.wallet-pass-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.wallet-pass-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--neutral-900);
}
.wallet-pass-subtitle {
  color: var(--neutral-600);
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
}
.wallet-pass-btn {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-sm);
  background: var(--brand-600);
  color: var(--white);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}
.wallet-pass-btn:hover {
  background: var(--brand-700);
}
.tickets-section h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0 0 var(--space-4);
}
.tickets-list {
  display: grid;
  gap: var(--space-4);
}
.ticket-card {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  background: var(--white);
}
.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}
.ticket-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--neutral-900);
}
.availability-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px var(--space-3);
  border-radius: 999px;
}
.availability-badge.t-available {
  background: #dcfce7;
  color: #166534;
}
.availability-badge.t-limited {
  background: #fef9c3;
  color: #854d0e;
}
.availability-badge.t-sold-out {
  background: #fee2e2;
  color: #991b1b;
}
.ticket-description {
  color: var(--neutral-600);
  font-size: 14px;
  margin: 0 0 var(--space-3);
}
.ticket-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-3);
  border-top: 1px solid var(--neutral-100);
}
.ticket-price {
  font-size: 18px;
  font-weight: 700;
  color: var(--neutral-900);
}
.ticket-quantity {
  font-size: 13px;
  color: var(--neutral-500);
}
.book-btn {
  margin-top: var(--space-4);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: var(--radius-sm);
  background: var(--brand-600);
  color: var(--white);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}
.book-btn:hover:not(:disabled) {
  background: var(--brand-700);
}
.book-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}
.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal h3 {
  margin: 0 0 var(--space-2);
  font-size: 20px;
}
.modal-price {
  color: var(--neutral-600);
  margin: 0 0 var(--space-4);
}
.form-group {
  margin-bottom: var(--space-4);
}
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-700);
  margin-bottom: var(--space-1);
}
.form-group input,
.form-group textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-sm);
  font-size: 14px;
}
.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--brand-600);
}
.error {
  color: #dc2626;
  font-size: 14px;
  margin: var(--space-2) 0;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
.modal-actions button {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}
.modal-actions .primary {
  background: var(--brand-600);
  color: var(--white);
  border: none;
}
.modal-actions .primary:hover:not(:disabled) {
  background: var(--brand-700);
}
.modal-actions .primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.modal-actions .secondary {
  background: var(--white);
  color: var(--neutral-700);
  border: 1px solid var(--neutral-200);
}
.modal-actions .secondary:hover {
  background: var(--neutral-50);
}
</style>
