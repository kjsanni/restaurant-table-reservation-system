<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToastStore } from "@/stores/toast";
import eventPortalAPI from "@/services/eventPortalAPI";
import EventPhotoUpload from "@/components/EventPhotoUpload.vue";

interface QRCode {
  id: number;
  code: string;
  tokenHash?: string;
  status: string;
  checkedInAt?: string;
  expiresAt?: string;
  validFrom?: string;
  maxUses?: number;
  usedCount?: number;
  attendeeName?: string;
  seat?: string;
  tier?: string;
  ticketType?: string;
  guestListId?: number;
  photoRef?: string | null;
}

const route = useRoute();
const router = useRouter();
const toast = useToastStore();
const eventId = computed(() => Number(route.params.eventId));
const event = ref<{ id: number; name: string } | null>(null);
const qrCodes = ref<QRCode[]>([]);
const loading = ref(false);
const generating = ref(false);

const load = async () => {
  loading.value = true;
  try {
    const [eventRes, qrRes] = await Promise.all([
      eventPortalAPI.getEvent(eventId.value),
      eventPortalAPI.getQRCodes(eventId.value),
    ]);
    event.value = (eventRes.data?.item || eventRes.data) as {
      id: number;
      name: string;
    };
    qrCodes.value = (qrRes.data?.rows || qrRes.data || []) as QRCode[];
  } catch (err) {
    toast.add("Failed to load QR codes", "error", 4000);
  } finally {
    loading.value = false;
  }
};

const generate = async () => {
  generating.value = true;
  try {
    await eventPortalAPI.generateQRCode(eventId.value, {});
    toast.add("QR code generated", "success", 3000);
    load();
  } catch (err) {
    toast.add("Failed to generate QR code", "error", 4000);
  } finally {
    generating.value = false;
  }
};

const generateForGuest = async (guestId: number) => {
  try {
    await eventPortalAPI.generateGuestQRCode(eventId.value, guestId);
    toast.add("Guest QR code generated", "success", 3000);
    load();
  } catch (err) {
    toast.add("Failed to generate guest QR code", "error", 4000);
  }
};

const goBack = () => {
  router.push({ name: "event-management" });
};

const openScanner = () => {
  router.push({
    name: "event-scanner",
    params: { eventId: route.params.eventId },
  });
};

const updateQRPhoto = (qrId: number, photoRef: string | null) => {
  const qr = qrCodes.value.find((item) => item.id === qrId);
  if (qr) {
    qr.photoRef = photoRef;
  }
};

onMounted(() => {
  load();
});
</script>

<template>
  <div class="qr-manage-view">
    <div class="page-header">
      <div>
        <button class="back-btn" @click="goBack" aria-label="Back to events">
          <span class="mdi mdi:arrow-left"></span>
          Back
        </button>
        <h1 v-if="event">QR Codes: {{ event.name }}</h1>
        <p class="subtitle">Manage QR codes for check-in</p>
      </div>
      <div class="header-actions">
        <button
          class="btn-secondary"
          v-tap-scale
          @click="openScanner"
          title="Open check-in scanner"
        >
          <span class="mdi mdi:qrcode-scan"></span>
          Scanner
        </button>
        <button
          class="btn-primary"
          v-tap-scale
          :disabled="generating"
          @click="generate"
        >
          {{ generating ? "Generating..." : "+ Generate QR Code" }}
        </button>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="qrCodes.length === 0" class="empty-state">
        No QR codes yet. Generate one to get started.
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Token Hash</th>
              <th>Status</th>
              <th>Attendee</th>
              <th>Photo</th>
              <th>Checked In</th>
              <th>Usage</th>
              <th>Expires</th>
              <th>Tier</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="qr in qrCodes" :key="qr.id">
              <td>
                <code class="qr-code">{{
                  qr.tokenHash ? qr.tokenHash.substring(0, 8) + "..." : qr.code
                }}</code>
              </td>
              <td>
                <span class="badge" :class="statusClass(qr.status)">
                  {{ qr.status }}
                </span>
              </td>
              <td class="attendee-col">
                {{ qr.attendeeName || "-" }}
              </td>
              <td>
                <EventPhotoUpload
                  v-if="qr.status === 'active'"
                  :event-id="eventId"
                  label="Upload"
                  :model-value="qr.photoRef"
                  @update:model-value="(photoRef) => updateQRPhoto(qr.id, photoRef)"
                />
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                {{
                  qr.checkedInAt
                    ? new Date(qr.checkedInAt).toLocaleString()
                    : "-"
                }}
              </td>
              <td class="usage-col">
                {{ qr.usedCount ?? 0 }} / {{ qr.maxUses ?? 1 }}
              </td>
              <td>
                {{
                  qr.expiresAt ? new Date(qr.expiresAt).toLocaleString() : "-"
                }}
              </td>
              <td class="tier-col">
                <span
                  v-if="qr.tier"
                  class="badge badge--{{ qr.tier.toLowerCase() }}"
                  >{{ qr.tier }}</span
                >
                <span v-else class="text-muted">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
const statusClass = (status: string) => {
  const map: Record<string, string> = {
    active: "badge-success",
    used: "badge-info",
    expired: "badge-warning",
    cancelled: "badge-danger",
  };
  return map[status] || "badge";
};
</script>

<style scoped>
.qr-manage-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
}
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
}
.page-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}
.subtitle {
  color: var(--neutral-500);
  margin: var(--space-1) 0 0;
}
.card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
}
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--neutral-100);
}
.data-table th {
  font-size: 12px;
  font-weight: 600;
  color: var(--neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.attendee-col {
  font-size: 13px;
  color: var(--neutral-700);
}
.usage-col {
  font-size: 12px;
  color: var(--neutral-600);
  white-space: nowrap;
}
.tier-col {
  text-align: center;
}
.qr-code {
  font-family: monospace;
  font-size: 13px;
  background: var(--neutral-100);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
}
.badge {
  display: inline-block;
  padding: 2px var(--space-3);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: var(--neutral-100);
  color: var(--neutral-700);
}
.badge-success {
  background: #dcfce7;
  color: #166534;
}
.badge-danger {
  background: #fee2e2;
  color: #991b1b;
}
.badge-info {
  background: #dbeafe;
  color: #1e40af;
}
.badge-muted {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
.badge-warning {
  background: #fef9c3;
  color: #854d0e;
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
}
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--neutral-500);
}
.header-actions {
  display: flex;
  gap: var(--space-3);
}
.btn-secondary {
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
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-sm);
  background: var(--brand-600);
  color: var(--white);
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.text-muted {
  color: var(--neutral-400);
}
</style>
