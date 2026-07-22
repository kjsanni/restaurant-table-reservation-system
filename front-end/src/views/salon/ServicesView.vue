<script setup lang="ts">
import { ref, onMounted } from "vue";
import serviceAPI from "@/services/serviceAPI";
import logger from "@/utils/logger";

interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  depositAmount: number;
  bufferMinutes: number;
  isAvailable: boolean;
  whatsappBookable: boolean;
  category?: { id?: number; name?: string };
}

const services = ref<Service[]>([]);
const categories = ref<{ id: number; name: string }[]>([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref<number | null>(null);
const form = ref({
  name: "",
  description: "",
  price: 0,
  durationMinutes: 30,
  depositAmount: 0,
  bufferMinutes: 0,
  categoryId: null as number | null,
  isAvailable: true,
  whatsappBookable: true,
});

const loadServices = async () => {
  loading.value = true;
  try {
    const svcRes = await serviceAPI.getServices({ limit: 100 });
    services.value = svcRes.data.data || [];
    categories.value = [
      { id: 0, name: "Uncategorised" },
      { id: 1, name: "Hair" },
      { id: 2, name: "Nails" },
      { id: 3, name: "Facial" },
      { id: 4, name: "Massage" },
      { id: 5, name: "Treatment" },
      { id: 6, name: "Color" },
      { id: 7, name: "Other" },
    ];
  } catch (err) {
    logger.error("Failed to load services", { error: err });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.value = {
    name: "",
    description: "",
    price: 0,
    durationMinutes: 30,
    depositAmount: 0,
    bufferMinutes: 0,
    categoryId: null,
    isAvailable: true,
    whatsappBookable: true,
  };
  editingId.value = null;
};

const editService = (svc: Service) => {
  editingId.value = svc.id;
  form.value = {
    name: svc.name,
    description: svc.description || "",
    price: Number(svc.price),
    durationMinutes: svc.durationMinutes,
    depositAmount: Number(svc.depositAmount),
    bufferMinutes: svc.bufferMinutes || 0,
    categoryId: svc.category?.id || null,
    isAvailable: svc.isAvailable,
    whatsappBookable: svc.whatsappBookable,
  };
  showForm.value = true;
};

const submitForm = async () => {
  try {
    const payload = {
      ...form.value,
      categoryId: form.value.categoryId || null,
    };
    if (editingId.value) {
      const res = await serviceAPI.updateService(editingId.value, payload);
      const idx = services.value.findIndex((s) => s.id === editingId.value);
      if (idx !== -1) services.value[idx] = res.data.data;
    } else {
      const res = await serviceAPI.createService(payload);
      services.value.push(res.data.data);
    }
    showForm.value = false;
    resetForm();
  } catch (err) {
    logger.error("Failed to save service", { error: err });
  }
};

const toggleAvailability = async (svc: Service) => {
  try {
    await serviceAPI.updateService(svc.id, { isAvailable: !svc.isAvailable });
    svc.isAvailable = !svc.isAvailable;
  } catch (err) {
    logger.error("Failed to toggle service availability", { error: err });
  }
};

onMounted(loadServices);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Services</h1>
        <p>Manage salon service catalog and pricing</p>
      </div>
      <div class="topbar-right">
        <button
          class="btn-primary"
          @click="
            showForm = true;
            resetForm();
          "
        >
          + Add Service
        </button>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading services...</p>
      </div>

      <div v-else class="services-grid">
        <div v-for="svc in services" :key="svc.id" class="service-card">
          <div class="service-head">
            <div>
              <h3>{{ svc.name }}</h3>
              <span v-if="svc.category?.name" class="service-category">
                {{ svc.category.name }}
              </span>
            </div>
            <div class="service-actions">
              <button class="btn-sm" @click="editService(svc)">Edit</button>
              <button
                :class="['btn-toggle', svc.isAvailable ? 'active' : 'inactive']"
                @click="toggleAvailability(svc)"
              >
                {{ svc.isAvailable ? "Hide" : "Show" }}
              </button>
            </div>
          </div>
          <p v-if="svc.description" class="service-desc">
            {{ svc.description }}
          </p>
          <div class="service-meta">
            <span class="service-price">{{ svc.price }} GHS</span>
            <span class="service-duration">{{ svc.durationMinutes }} min</span>
            <span v-if="svc.depositAmount > 0" class="service-deposit">
              Deposit: {{ svc.depositAmount }} GHS
            </span>
          </div>
          <div class="service-footer">
            <span v-if="svc.whatsappBookable" class="wa-badge">WhatsApp</span>
            <span v-if="svc.bufferMinutes > 0" class="buffer-badge">
              +{{ svc.bufferMinutes }}m buffer
            </span>
          </div>
        </div>
        <div v-if="!services.length" class="empty-state">
          No services found.
        </div>
      </div>

      <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
        <div class="modal">
          <h2>{{ editingId ? "Edit Service" : "New Service" }}</h2>
          <div class="form-group">
            <label>Name</label>
            <input v-model="form.name" placeholder="e.g. Classic Haircut" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="form.description" rows="2"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Price (GHS)</label>
              <input
                v-model.number="form.price"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
            <div class="form-group">
              <label>Duration (min)</label>
              <input
                v-model.number="form.durationMinutes"
                type="number"
                min="5"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Deposit (GHS)</label>
              <input
                v-model.number="form.depositAmount"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
            <div class="form-group">
              <label>Buffer (min)</label>
              <input
                v-model.number="form.bufferMinutes"
                type="number"
                min="0"
              />
            </div>
          </div>
          <div class="form-group">
            <label>Category</label>
            <select v-model="form.categoryId">
              <option :value="null">Uncategorised</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="form.isAvailable" type="checkbox" />
              Available for booking
            </label>
            <label class="checkbox-label">
              <input v-model="form.whatsappBookable" type="checkbox" />
              WhatsApp bookable
            </label>
          </div>
          <div class="modal-actions">
            <button
              class="btn-secondary"
              @click="
                showForm = false;
                resetForm();
              "
            >
              Cancel
            </button>
            <button class="btn-primary" @click="submitForm">Save</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background-warm);
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
.topbar-right {
  display: flex;
  gap: 12px;
}
.content-wrapper {
  margin: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--neutral-600);
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--brand-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.service-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 20px;
  box-shadow: 0 8px 24px rgba(26, 20, 16, 0.04);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.service-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.service-head h3 {
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0;
}
.service-category {
  display: inline-block;
  margin-top: 6px;
  padding: 3px 10px;
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  color: var(--accent-600);
  font-size: 12px;
  font-weight: 600;
}
.service-actions {
  display: flex;
  gap: 8px;
}
.service-desc {
  font-size: 13px;
  color: var(--neutral-600);
  margin: 0;
}
.service-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-800);
}
.service-price {
  color: var(--brand-600);
}
.service-duration {
  color: var(--neutral-600);
}
.service-deposit {
  color: var(--accent-600);
}
.service-footer {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.wa-badge {
  padding: 3px 8px;
  border-radius: var(--radius-md);
  background: #dcf8c6;
  color: #075e54;
  font-size: 11px;
  font-weight: 700;
}
.buffer-badge {
  padding: 3px 8px;
  border-radius: var(--radius-md);
  background: var(--neutral-100);
  color: var(--neutral-700);
  font-size: 11px;
  font-weight: 600;
}
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--neutral-600);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: 24px;
  width: 90%;
  max-width: 460px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
}
.modal h2 {
  font-family: var(--font-serif);
  font-size: 22px;
  margin: 0 0 16px;
}
.form-group {
  margin-bottom: 14px;
}
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-700);
  margin-bottom: 6px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--neutral-900);
  background: var(--white);
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-700);
  cursor: pointer;
}
.checkbox-label input {
  width: auto;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}
.btn-primary {
  background: var(--brand-500);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 18px;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary {
  background: var(--neutral-100);
  color: var(--neutral-700);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  padding: 10px 18px;
  font-weight: 600;
  cursor: pointer;
}
.btn-sm {
  background: var(--brand-500);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.btn-toggle {
  border: none;
  border-radius: var(--radius-md);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.btn-toggle.active {
  background: #fee2e2;
  color: #991b1b;
}
.btn-toggle.inactive {
  background: #d1fae5;
  color: #065f46;
}
</style>
