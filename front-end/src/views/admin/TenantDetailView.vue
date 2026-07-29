<template>
  <div class="tenant-detail">
    <div class="header">
      <button @click="$router.back()" class="back-btn">← Back</button>
      <h1>{{ tenant.name }}</h1>
      <span :class="['status-badge', tenant.status]">{{ tenant.status }}</span>
      <button @click="accessTenant" class="btn-access">Access Venue</button>
    </div>

    <div class="grid">
      <div class="section">
        <h2>Venue Information</h2>
        <div class="info-row">
          <span class="label">Slug</span>
          <span class="value">{{ tenant.slug }}</span>
        </div>
        <div class="info-row">
          <span class="label">Domain</span>
          <span class="value">{{ tenant.domain || "—" }}</span>
        </div>
        <div class="info-row">
          <span class="label">Plan</span>
          <span class="value">{{ tenant.plan }}</span>
        </div>
        <div class="info-row">
          <span class="label">Currency</span>
          <span class="value">{{ tenant.currency }}</span>
        </div>
        <div class="info-row">
          <span class="label">Billing Email</span>
          <span class="value">{{ tenant.billingEmail || "—" }}</span>
        </div>
        <div class="info-row">
          <span class="label">Module</span>
          <span class="value">{{
            tenant.businessVertical || "restaurant"
          }}</span>
        </div>
      </div>

      <div class="section">
        <h2>Subscription</h2>
        <div class="info-row">
          <span class="label">Status</span>
          <span class="value">{{ tenant.subscriptionStatus }}</span>
        </div>
        <div class="info-row">
          <span class="label">Current Period End</span>
          <span class="value">{{ formatDate(tenant.currentPeriodEnd) }}</span>
        </div>
        <div class="info-row">
          <span class="label">Cancel At Period End</span>
          <span class="value">{{
            tenant.cancelAtPeriodEnd ? "Yes" : "No"
          }}</span>
        </div>
        <div class="info-row">
          <span class="label">Grace Ends At</span>
          <span class="value">{{ formatDate(tenant.graceEndsAt) }}</span>
        </div>
        <div class="info-row">
          <span class="label">Last Payment</span>
          <span class="value">{{ formatDate(tenant.lastPaymentAt) }}</span>
        </div>
      </div>

      <div class="section">
        <h2>WhatsApp Configuration</h2>
        <p class="section-hint">
          Configure WhatsApp Business API for this venue. Managed by platform
          admin only.
        </p>
        <div class="field">
          <label>Phone Number ID</label>
          <input
            v-model="whatsappForm.phoneNumberId"
            placeholder="1234567890"
          />
        </div>
        <div class="field">
          <label>WhatsApp Token</label>
          <input
            v-model="whatsappForm.token"
            type="password"
            placeholder="EAAG..."
          />
        </div>
        <button
          class="btn success"
          @click="saveWhatsApp"
          :disabled="savingWhatsApp"
        >
          {{ savingWhatsApp ? "Saving..." : "Save WhatsApp Settings" }}
        </button>
        <span v-if="whatsappSaved" class="saved-tag">Saved</span>
      </div>

      <div class="section">
        <h2>Payout Configuration</h2>
        <p class="section-hint">
          Configure Paystack subaccount for automatic settlement splits. Funds
          are routed directly to this subaccount when customers pay.
        </p>
        <div class="field">
          <label>Paystack Subaccount Code</label>
          <input
            v-model="payoutForm.paystackSubaccountCode"
            placeholder="ACCT_..."
          />
        </div>
        <button
          class="btn success"
          @click="savePayout"
          :disabled="savingPayout"
        >
          {{ savingPayout ? "Saving..." : "Save Payout Settings" }}
        </button>
        <span v-if="payoutSaved" class="saved-tag">Saved</span>
      </div>
    </div>

    <div class="actions">
      <button
        v-if="tenant.status === 'suspended' || tenant.status === 'past_due'"
        @click="enableTenant"
        class="btn success"
      >
        Enable Venue
      </button>
      <button
        v-if="tenant.status === 'active' || tenant.status === 'past_due'"
        @click="disableTenant"
        class="btn danger"
      >
        Disable Venue
      </button>
      <button
        v-if="tenant.status !== 'cancelled'"
        @click="deleteTenant"
        class="btn danger"
        :disabled="deleting"
      >
        {{ deleting ? "Deleting..." : "Delete Venue" }}
      </button>
      <button class="btn" @click="exportTenantData" :disabled="exporting">
        {{ exporting ? "Exporting..." : "Export Data" }}
      </button>
      <p v-if="deleteError" class="error-text">{{ deleteError }}</p>
      <p v-if="exportError" class="error-text">{{ exportError }}</p>
    </div>

    <div class="section">
      <h2>Module Configuration</h2>
      <p class="section-hint">
        Switch this venue's business vertical. This enables the corresponding
        module (restaurant or salon) and branding.
      </p>
      <div class="field">
        <label>Business Vertical</label>
        <select v-model="businessVertical" :disabled="savingVertical">
          <option value="restaurant">Restaurant</option>
          <option value="salon">Salon</option>
        </select>
      </div>
      <button
        class="btn primary"
        @click="saveVertical"
        :disabled="savingVertical"
      >
        {{ savingVertical ? "Saving..." : "Save Module" }}
      </button>
      <span v-if="verticalSaved" class="saved-tag">Saved</span>
    </div>

    <div class="section">
      <h2>Restaurant Subtype</h2>
      <p class="section-hint">
        Fine-tune the restaurant type for this venue. This affects default
        features and pricing recommendations.
      </p>
      <div class="field">
        <label>Subtype</label>
        <select v-model="restaurantSubtype" :disabled="savingSubtype">
          <option value="">—</option>
          <option value="fine_dining">Fine Dining</option>
          <option value="fast_food">Fast Food</option>
          <option value="cafe">Cafe</option>
          <option value="casual_dining">Casual Dining</option>
          <option value="bar_pub">Bar / Pub</option>
          <option value="food_truck">Food Truck</option>
          <option value="buffet">Buffet</option>
          <option value="cloud_kitchen">Cloud Kitchen</option>
        </select>
      </div>
      <button
        class="btn primary"
        @click="saveSubtype"
        :disabled="savingSubtype"
      >
        {{ savingSubtype ? "Saving..." : "Save Subtype" }}
      </button>
      <span v-if="subtypeSaved" class="saved-tag">Saved</span>
    </div>

    <div class="section">
      <h2>Data Residency</h2>
      <p class="section-hint">
        Track where this venue's data is stored and any residency requirements.
      </p>
      <div class="field">
        <label>Data Region</label>
        <select v-model="dataRegion" :disabled="savingResidency">
          <option value="">—</option>
          <option value="gh">Ghana</option>
          <option value="eu">EU</option>
          <option value="us">US</option>
          <option value="uk">UK</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="field">
        <label>Residency Notes</label>
        <textarea
          v-model="residencyNotes"
          rows="3"
          placeholder="Any special data residency requirements or notes..."
        ></textarea>
      </div>
      <button
        class="btn primary"
        @click="saveResidency"
        :disabled="savingResidency"
      >
        {{ savingResidency ? "Saving..." : "Save Residency" }}
      </button>
      <span v-if="residencySaved" class="saved-tag">Saved</span>
    </div>

    <div class="section notes-section">
      <h2>Notes</h2>
      <div class="note-form">
        <textarea
          v-model="newNote"
          rows="2"
          placeholder="Add a support note for this venue..."
        ></textarea>
        <button
          class="btn"
          @click="addNote"
          :disabled="addingNote || !newNote.trim()"
        >
          {{ addingNote ? "Adding..." : "Add Note" }}
        </button>
      </div>
      <ul class="notes-list" v-if="notes.length">
        <li v-for="note in notes" :key="note.id" class="note-item">
          <div class="note-body">
            <p class="note-text">{{ note.note }}</p>
            <span class="note-date">{{ formatDate(note.createdAt) }}</span>
          </div>
          <button class="note-delete" @click="removeNote(note)">Delete</button>
        </li>
      </ul>
      <p v-else class="notes-empty">No notes yet.</p>
    </div>

    <div class="section users-section">
      <h2>Users ({{ tenant.users?.length || 0 }})</h2>
      <table class="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in tenant.users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.role }}</td>
            <td>{{ formatDate(user.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section notes-section">
      <h2>Support Notes</h2>
      <div class="notes-list">
        <div v-for="note in notes" :key="note.id" class="note-item">
          <div class="note-text">{{ note.note }}</div>
          <div class="note-meta">{{ formatDate(note.createdAt) }}</div>
          <button @click="removeNote(note)" class="btn-small danger">
            Delete
          </button>
        </div>
        <div v-if="!notes.length" class="empty-notes">No notes yet</div>
      </div>
      <div class="note-form">
        <input
          v-model="newNote"
          placeholder="Add a note..."
          class="note-input"
        />
        <button @click="addNote" class="btn-primary">Add</button>
      </div>
    </div>

    <div class="section erpnext-section">
      <h2>ERPNext Modules</h2>
      <p class="section-hint">
        Toggle ERPNext modules for this tenant. Module availability depends on the tenant's subscription plan.
      </p>
      <div class="erpnext-modules-grid">
        <div
          v-for="mod in erpnextModuleOptions"
          :key="mod.flag"
          class="erpnext-module-card"
        >
          <div class="module-header">
            <span class="module-name">{{ mod.name }}</span>
            <label class="toggle-switch">
              <input
                type="checkbox"
                :checked="tenantFeatureFlags[mod.flag]"
                @change="toggleErpnextModule(mod.flag, $event.target.checked)"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <p class="module-desc">{{ mod.description }}</p>
          <p v-if="!modAllowed(mod.flag)" class="module-warning">
            Not included in {{ tenant.plan }} plan
          </p>
        </div>
      </div>
      <div v-if="savingErpnext" class="saving-indicator">Saving...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import tenantAdminAPI from "@/services/tenantAdminAPI";
import noteAPI from "@/services/noteAPI";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const tenant = ref({ users: [] });
const notes = ref([]);
const newNote = ref("");
const addingNote = ref(false);
const savingWhatsApp = ref(false);
const whatsappSaved = ref(false);
const savingPayout = ref(false);
const payoutSaved = ref(false);
const deleting = ref(false);
const deleteError = ref("");
const exporting = ref(false);
const exportError = ref("");
const businessVertical = ref("restaurant");
const savingVertical = ref(false);
const verticalSaved = ref(false);
const restaurantSubtype = ref("");
const savingSubtype = ref(false);
const subtypeSaved = ref(false);
const dataRegion = ref("");
const residencyNotes = ref("");
const savingResidency = ref(false);
const residencySaved = ref(false);
const whatsappForm = ref({
  phoneNumberId: "",
  token: "",
});
const payoutForm = ref({
  paystackSubaccountCode: "",
});
const erpnextFeatureFlags = ref({});
const savingErpnext = ref(false);

const erpnextModuleOptions = [
  { flag: "erpnext_accounting", name: "Accounting", description: "Invoice, payment, and financial ledger sync" },
  { flag: "erpnext_stock", name: "Inventory", description: "Stock items, warehouses, and stock ledger sync" },
  { flag: "erpnext_crm", name: "CRM", description: "Customer leads and campaign tracking" },
  { flag: "erpnext_hr", name: "HR", description: "Employee records, attendance, and payroll" },
  { flag: "erpnext_pos", name: "POS", description: "Point of sale integration" },
  { flag: "erpnext_manufacturing", name: "Manufacturing", description: "BOM categories and production planning" },
];

const tenantFeatureFlags = computed(() => {
  return tenant.value.settings?.featureFlags || {};
});

const modAllowed = (flag) => {
  const allowedModules = tenant.value.planData?.erpnextModules;
  if (allowedModules === null || allowedModules === undefined) return true;
  return allowedModules.includes(flag);
};

const toggleErpnextModule = async (flag, enabled) => {
  savingErpnext.value = true;
  try {
    await tenantAdminAPI.updateFeatureFlags(route.params.id, {
      [flag]: enabled,
    });
    await loadTenant();
  } catch (err) {
    console.error("Failed to toggle ERPNext module:", err);
  } finally {
    savingErpnext.value = false;
  }
};

const loadTenant = async () => {
  const response = await tenantAdminAPI.getById(route.params.id);
  tenant.value = response.data.item;
  businessVertical.value = tenant.value.businessVertical || "restaurant";
  restaurantSubtype.value = tenant.value.restaurantSubtype || "";
  const wa = tenant.value.whatsappConfig || {};
  whatsappForm.value = {
    phoneNumberId: wa.phoneNumberId || "",
    token: wa.token || "",
  };
  payoutForm.value = {
    paystackSubaccountCode: tenant.value.paystackSubaccountCode || "",
  };
  dataRegion.value = tenant.value.dataRegion || "";
  residencyNotes.value = tenant.value.residencyNotes || "";
  await loadNotes();
};

const loadNotes = async () => {
  const response = await noteAPI.listNotes(route.params.id);
  notes.value = response.data.collection || response.data.items || [];
};

const addNote = async () => {
  if (!newNote.value.trim()) return;
  addingNote.value = true;
  try {
    await noteAPI.createNote(route.params.id, newNote.value.trim());
    newNote.value = "";
    await loadNotes();
  } finally {
    addingNote.value = false;
  }
};

const removeNote = async (note) => {
  if (!confirm("Permanently delete this support note?")) return;
  await noteAPI.deleteNote(route.params.id, note.id);
  notes.value = notes.value.filter((n) => n.id !== note.id);
};

const accessTenant = () => {
  authStore.setTenant({
    id: tenant.value.id,
    name: tenant.value.name,
    slug: tenant.value.slug,
  });
  router.push("/reservations");
};

const enableTenant = async () => {
  await tenantAdminAPI.enable(route.params.id);
  await loadTenant();
};

const disableTenant = async () => {
  if (
    !confirm(
      "Are you sure you want to disable this venue? This will prevent them from accessing the platform."
    )
  )
    return;
  const reason = prompt("Reason for disabling venue (optional):") || "";
  await tenantAdminAPI.disable(route.params.id, { reason });
  await loadTenant();
};

const deleteTenant = async () => {
  deleteError.value = "";
  if (
    !confirm(
      `Permanently delete "${tenant.value.name}"? This will soft-delete this venue and cannot be undone.`
    )
  )
    return;
  const confirmation = prompt("Type the tenant slug to confirm deletion:");
  if (confirmation !== tenant.value.slug) {
    deleteError.value = "Slug confirmation did not match.";
    return;
  }
  deleting.value = true;
  try {
    await tenantAdminAPI.deleteTenant(route.params.id);
    router.push("/super-admin/tenants");
  } catch (err) {
    deleteError.value =
      err?.response?.data?.message || "Failed to delete venue.";
  } finally {
    deleting.value = false;
  }
};

const exportTenantData = async () => {
  exportError.value = "";
  exporting.value = true;
  try {
    const response = await tenantAdminAPI.exportData(route.params.id);
    const blob = new Blob([JSON.stringify(response.data.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tenant-${tenant.value.slug}-export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    exportError.value =
      err?.response?.data?.message || "Failed to export tenant data.";
  } finally {
    exporting.value = false;
  }
};

const saveWhatsApp = async () => {
  savingWhatsApp.value = true;
  whatsappSaved.value = false;
  try {
    await tenantAdminAPI.update(route.params.id, {
      whatsappConfig: whatsappForm.value,
    });
    whatsappSaved.value = true;
    setTimeout(() => (whatsappSaved.value = false), 2000);
    await loadTenant();
  } finally {
    savingWhatsApp.value = false;
  }
};

const savePayout = async () => {
  savingPayout.value = true;
  payoutSaved.value = false;
  try {
    await tenantAdminAPI.update(route.params.id, {
      paystackSubaccountCode: payoutForm.value.paystackSubaccountCode,
    });
    payoutSaved.value = true;
    setTimeout(() => (payoutSaved.value = false), 2000);
    await loadTenant();
  } finally {
    savingPayout.value = false;
  }
};

const saveVertical = async () => {
  savingVertical.value = true;
  verticalSaved.value = false;
  try {
    await tenantAdminAPI.update(route.params.id, {
      businessVertical: businessVertical.value,
    });
    verticalSaved.value = true;
    setTimeout(() => (verticalSaved.value = false), 2000);
    await loadTenant();
    if (authStore.currentTenant?.id === tenant.value.id) {
      authStore.setTenant({
        ...authStore.currentTenant,
        businessVertical: businessVertical.value,
      });
      await authStore.fetchCapabilities();
    }
  } finally {
    savingVertical.value = false;
  }
};

const saveSubtype = async () => {
  savingSubtype.value = true;
  subtypeSaved.value = false;
  try {
    await tenantAdminAPI.update(route.params.id, {
      restaurantSubtype: restaurantSubtype.value || null,
    });
    subtypeSaved.value = true;
    setTimeout(() => (subtypeSaved.value = false), 2000);
    await loadTenant();
  } finally {
    savingSubtype.value = false;
  }
};

const saveResidency = async () => {
  savingResidency.value = true;
  residencySaved.value = false;
  try {
    await tenantAdminAPI.update(route.params.id, {
      dataRegion: dataRegion.value || null,
      residencyNotes: residencyNotes.value || null,
    });
    residencySaved.value = true;
    setTimeout(() => (residencySaved.value = false), 2000);
    await loadTenant();
  } finally {
    savingResidency.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

onMounted(() => {
  loadTenant();
  loadNotes();
});
</script>

<style scoped>
.tenant-detail {
  padding: var(--space-6);
  max-width: 960px;
}
.header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.back-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}
.back-btn:hover {
  color: var(--accent-600);
}
.btn-access {
  margin-left: auto;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(
    135deg,
    var(--brand-700) 0%,
    var(--brand-600) 100%
  );
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  font-family: var(--font-sans);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn-access:hover {
  background: linear-gradient(
    135deg,
    var(--brand-600) 0%,
    var(--brand-500) 100%
  );
  box-shadow: var(--shadow-md);
}
.back-btn:hover {
  color: var(--accent-hover);
}
.header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
  margin: 0;
}
.status-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.status-badge.active {
  background: var(--earth-100);
  color: var(--earth-600);
}
.status-badge.past_due {
  background: var(--accent-100);
  color: var(--accent-600);
}
.status-badge.suspended {
  background: var(--rose-100);
  color: var(--rose-600);
}
.status-badge.cancelled {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
.status-badge.trialing {
  background: var(--sky-100);
  color: var(--sky-600);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}
.section {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.section h2 {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 650;
  margin: 0 0 var(--space-4) 0;
  color: var(--ink);
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border-subtle);
}
.info-row:last-child {
  border-bottom: none;
}
.label {
  color: var(--ink-muted);
  font-size: var(--text-sm);
}
.value {
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}
.actions {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}
.btn {
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.section-hint {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin: 0 0 var(--space-4) 0;
  line-height: var(--leading-relaxed);
}
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1-5);
  margin-bottom: var(--space-3);
}
.field label {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  font-weight: 500;
}
.field input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.field input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.saved-tag {
  margin-left: var(--space-3);
  color: var(--earth-600);
  font-size: var(--text-sm);
  font-weight: 600;
}
.error-text {
  margin-left: var(--space-3);
  color: var(--rose-600);
  font-size: var(--text-sm);
  font-weight: 600;
}
.btn.success {
  background: linear-gradient(
    135deg,
    var(--earth-500) 0%,
    var(--earth-600) 100%
  );
  color: var(--white);
}
.btn.success:hover {
  box-shadow: var(--shadow-md);
}
.btn.danger {
  background: linear-gradient(135deg, var(--rose-500) 0%, var(--rose-600) 100%);
  color: var(--white);
}
.btn.danger:hover {
  box-shadow: var(--shadow-md);
}
.notes-section h2 {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 650;
  margin: 0 0 var(--space-4) 0;
  color: var(--ink);
}
.note-form {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  align-items: flex-start;
}
.note-form textarea {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  resize: vertical;
}
.note-form textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.notes-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.note-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-sunken);
}
.note-body {
  flex: 1;
}
.note-text {
  margin: 0 0 var(--space-1) 0;
  font-size: var(--text-sm);
  color: var(--ink);
  white-space: pre-wrap;
  word-break: break-word;
}
.note-date {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.note-delete {
  background: none;
  border: 1px solid var(--border);
  color: var(--rose-600);
  border-radius: var(--radius-full);
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-sans);
  transition: all var(--duration-150) var(--ease-in-out);
}
.note-delete:hover {
  background: var(--rose-100);
  border-color: var(--rose-300);
}
.notes-empty {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin: 0;
}
.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.users-table th,
.users-table td {
  padding: var(--space-2) var(--space-3);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.users-table th {
  font-weight: 600;
  color: var(--ink-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  background: var(--neutral-50);
}
.users-table tbody tr:hover {
  background: var(--surface-sunken);
}
.notes-section {
  margin-top: var(--space-6);
}
.notes-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.note-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
}
.note-text {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--ink);
  white-space: pre-wrap;
  word-break: break-word;
}
.note-meta {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  white-space: nowrap;
}
.empty-notes {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  padding: var(--space-3);
}
.note-form {
  display: flex;
  gap: var(--space-3);
}
.note-input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.erpnext-section {
  margin-top: var(--space-xl);
}
.erpnext-modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
  margin-top: var(--space-md);
}
.erpnext-module-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
}
.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}
.module-name {
  font-weight: 600;
  font-size: var(--text-base);
}
.module-desc {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin: 0 0 var(--space-sm);
}
.module-warning {
  font-size: var(--text-sm);
  color: var(--warning);
  margin: 0;
}
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.2s;
  border-radius: 24px;
}
.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}
.toggle-switch input:checked + .toggle-slider {
  background-color: var(--brand-500);
}
.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}
.saving-indicator {
  margin-top: var(--space-md);
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
</style>
