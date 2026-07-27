<template>
  <div class="marketplace-view">
    <div class="page-header">
      <div>
        <h1>Marketplace Listings</h1>
        <p class="subtitle">Featured tenants and marketplace positioning</p>
      </div>
      <button class="btn-primary" @click="openCreate">Add Listing</button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="listings.length === 0" class="empty-state">
        No listings
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Position</th>
              <th>Title</th>
              <th>Venue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="listing in listings" :key="listing.id">
              <td>{{ listing.position }}</td>
              <td>{{ listing.title }}</td>
              <td>{{ listing.tenant?.name || "—" }}</td>
              <td>
                <span
                  class="badge"
                  :class="listing.isActive ? 'badge-success' : 'badge-danger'"
                >
                  {{ listing.isActive ? "Active" : "Inactive" }}
                </span>
              </td>
              <td>
                <button class="btn-sm" @click="editListing(listing)">
                  Edit
                </button>
                <button
                  class="btn-sm btn-danger"
                  @click="removeListing(listing.id)"
                >
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editing?.id ? "Edit" : "New" }} Listing</h2>
        <form @submit.prevent="save">
          <div class="field">
            <label>Title</label>
            <input v-model="form.title" class="field-input" required />
          </div>
          <div class="field">
            <label>Description</label>
            <textarea
              v-model="form.description"
              class="field-input"
              rows="3"
            ></textarea>
          </div>
          <div class="field">
            <label>Position</label>
            <input v-model="form.position" type="number" class="field-input" />
          </div>
          <div class="field">
            <label class="checkbox-label">
              <input v-model="form.isActive" type="checkbox" />
              Active
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const listings = ref([]);
const showModal = ref(false);
const editing = ref(null);
const form = ref({ title: "", description: "", position: 0, isActive: true });

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listMarketplaceListings();
    listings.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editing.value = null;
  form.value = {
    title: "",
    description: "",
    position: listings.value.length,
    isActive: true,
  };
  showModal.value = true;
};

const editListing = (listing) => {
  editing.value = listing;
  form.value = { ...listing };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editing.value = null;
};

const save = async () => {
  if (editing.value?.id) {
    await adminAPI.updateMarketplaceListing(editing.value.id, form.value);
  } else {
    await adminAPI.createMarketplaceListing(form.value);
  }
  closeModal();
  load();
};

const removeListing = async (id) => {
  await adminAPI.removeMarketplaceListing(id);
  load();
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.marketplace-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 var(--space-1) 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
.card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
}
.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--ink-muted);
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
  border-bottom: 1px solid var(--border);
}
.data-table th {
  color: var(--ink-muted);
  font-weight: 600;
  font-size: var(--text-sm);
}
.btn-sm {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--white);
  cursor: pointer;
  font-size: var(--text-xs);
  margin-right: var(--space-2);
}
.btn-danger {
  color: var(--rose-600);
  border-color: var(--rose-200);
}
.badge {
  display: inline-block;
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
}
.badge-success {
  color: var(--green-600);
}
.badge-danger {
  color: var(--rose-600);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  width: 100%;
  max-width: 480px;
}
.modal h2 {
  margin: 0 0 var(--space-4) 0;
}
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
}
.field label {
  font-size: var(--text-sm);
  font-weight: 600;
}
.field-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 500;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
.btn-secondary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
</style>
