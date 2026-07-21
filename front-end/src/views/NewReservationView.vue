<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import reservationAPI from "@/services/reservationAPI";
import tableAPI from "@/services/tableAPI";

const route = useRoute();
const router = useRouter();

const reservation = ref({
  guestName: "",
  phone: "",
  email: "",
  occasion: "None",
  resDate: "",
  resTime: "",
  people: 2,
  tablePreference: "Auto-assign",
  notes: "",
});

const submitting = ref(false);
const isSuccessful = ref(false);
const generalError = ref("");
const validationErrors = ref<Record<string, string>>({});

const occasions = ["None", "Birthday", "Anniversary", "Business"];
const tableOptions = ref<{ value: string; label: string }[]>([]);

const validateForm = () => {
  validationErrors.value = {};
  const r = reservation.value;

  if (!r.guestName.trim())
    validationErrors.value.guestName = "Guest name is required.";
  if (!r.phone.trim()) {
    validationErrors.value.phone = "Phone number is required.";
  } else if (!/^[+]?[\d\s()-]{7,20}$/.test(r.phone.trim())) {
    validationErrors.value.phone = "Enter a valid phone number.";
  }
  if (!r.email.trim()) {
    validationErrors.value.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim())) {
    validationErrors.value.email = "Enter a valid email address.";
  }
  if (!r.resDate) validationErrors.value.resDate = "Date is required.";
  if (!r.resTime) validationErrors.value.resTime = "Time is required.";
  if (!r.people || r.people < 1)
    validationErrors.value.people = "At least 1 guest is required.";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (r.resDate && new Date(r.resDate) < today) {
    validationErrors.value.resDate = "Date cannot be in the past.";
  }

  return Object.keys(validationErrors.value).length === 0;
};

const loadTables = async () => {
  try {
    const res = await tableAPI.getTables();
    const tables = res.data.collection || res.data.tables || [];
    tableOptions.value = [
      { value: "Auto-assign", label: "Auto-assign" },
      ...tables.map((t: any) => ({
        value: String(t.id),
        label: `${t.name || `T${t.id}`}${t.section ? ` — ${t.section}` : ""}`,
      })),
    ];
  } catch {
    tableOptions.value = [
      { value: "Auto-assign", label: "Auto-assign" },
      { value: "T1", label: "T1 — Window" },
      { value: "T2", label: "T2 — Patio" },
      { value: "T3", label: "T3 — Main" },
    ];
  }
};

const submitReservation = async () => {
  if (!validateForm()) return;
  submitting.value = true;
  isSuccessful.value = false;
  generalError.value = "";

  try {
    const payload: any = {
      resDate: reservation.value.resDate,
      resTime: reservation.value.resTime,
      people: reservation.value.people,
      name: reservation.value.guestName,
      phone: reservation.value.phone,
      email: reservation.value.email,
      notes: reservation.value.notes,
    };

    if (reservation.value.occasion && reservation.value.occasion !== "None") {
      payload.occasion = reservation.value.occasion;
    }

    if (
      reservation.value.tablePreference &&
      reservation.value.tablePreference !== "Auto-assign"
    ) {
      payload.tableId = Number(reservation.value.tablePreference);
    }

    await reservationAPI.registerReservation(payload);
    isSuccessful.value = true;
    setTimeout(() => router.push("/reservations"), 1500);
  } catch (err) {
    const error = err as { response?: { data?: { message?: string } } };
    generalError.value =
      error.response?.data?.message || "Failed to create reservation";
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadTables();
  if (route.query.tableId) {
    tableAPI
      .getTables()
      .then((res) => {
        const table = (res.data.collection || res.data.tables || []).find(
          (t: any) => t.id === Number(route.query.tableId)
        );
        if (table)
          reservation.value.notes = `Prefer table ${table.name || table.id}`;
      })
      .catch(() => {});
  }
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>New Reservation</h1>
        <p>Create a booking for a guest</p>
      </div>
    </div>

    <div class="content-wrapper">
      <form @submit.prevent="submitReservation" class="form-card">
        <div class="form-grid">
          <div class="field full">
            <label for="guestName">Guest Name</label>
            <input
              id="guestName"
              v-model="reservation.guestName"
              type="text"
              placeholder="Full name"
            />
            <span v-if="validationErrors.guestName" class="field-error">
              {{ validationErrors.guestName }}
            </span>
          </div>
          <div class="field">
            <label for="phone">Phone</label>
            <input
              id="phone"
              v-model="reservation.phone"
              type="tel"
              placeholder="+233 ..."
            />
            <span v-if="validationErrors.phone" class="field-error">
              {{ validationErrors.phone }}
            </span>
          </div>
          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="reservation.email"
              type="email"
              placeholder="guest@example.com"
            />
            <span v-if="validationErrors.email" class="field-error">
              {{ validationErrors.email }}
            </span>
          </div>
          <div class="field">
            <label for="occasion">Occasion</label>
            <select id="occasion" v-model="reservation.occasion">
              <option v-for="opt in occasions" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
          </div>
          <div class="field">
            <label for="date">Date</label>
            <input id="date" v-model="reservation.resDate" type="date" />
            <span v-if="validationErrors.resDate" class="field-error">
              {{ validationErrors.resDate }}
            </span>
          </div>
          <div class="field">
            <label for="time">Time</label>
            <input id="time" v-model="reservation.resTime" type="time" />
            <span v-if="validationErrors.resTime" class="field-error">
              {{ validationErrors.resTime }}
            </span>
          </div>
          <div class="field">
            <label for="people">Party Size</label>
            <input
              id="people"
              v-model="reservation.people"
              type="number"
              min="1"
            />
            <span v-if="validationErrors.people" class="field-error">
              {{ validationErrors.people }}
            </span>
          </div>
          <div class="field">
            <label for="table">Table Preference</label>
            <select id="table" v-model="reservation.tablePreference">
              <option
                v-for="opt in tableOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="field full">
            <label for="notes">Notes</label>
            <textarea
              id="notes"
              v-model="reservation.notes"
              placeholder="Allergies, seating preferences, special requests..."
            ></textarea>
          </div>
        </div>
        <div class="form-actions">
          <div v-if="isSuccessful" class="success-message">
            Reservation created! Redirecting...
          </div>
          <div v-if="generalError" class="error-message">
            {{ generalError }}
          </div>
          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? "Creating..." : "Create Reservation" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background-warm);
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.topbar-left h1 {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--neutral-900);
}

.topbar-left p {
  color: var(--neutral-600);
  font-size: 14px;
  margin-top: 4px;
}

.content-wrapper {
  flex: 1;
  margin: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}

.form-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 32px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
  max-width: 820px;
  margin: 0 auto;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

@media (min-width: 640px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field.full {
  grid-column: 1 / -1;
}

.field label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-800);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: var(--font-sans);
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--neutral-900);
  background: var(--neutral-50);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--accent-500);
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.12);
}

.field textarea {
  resize: vertical;
  min-height: 80px;
}

.field-error {
  font-size: 12px;
  color: #dc2626;
  margin-top: 4px;
  font-family: var(--font-sans);
}

.form-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.btn-primary {
  padding: 11px 18px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(74, 53, 43, 0.22);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message {
  padding: 12px;
  border-radius: var(--radius-lg);
  background: var(--earth-100);
  color: var(--earth-600);
  font-size: 13px;
  font-family: var(--font-sans);
}

.error-message {
  padding: 12px;
  border-radius: var(--radius-lg);
  background: var(--rose-100);
  color: var(--rose-600);
  font-size: 13px;
  font-family: var(--font-sans);
}
</style>
