<script setup lang="ts">
import { ref, onMounted } from "vue";
import galleryAPI from "@/services/galleryAPI";
import logger from "@/utils/logger";
import { useI18n } from "@/composables/useI18n";
import { useToastStore } from "@/stores/toast";

const { t } = useI18n();
const toastStore = useToastStore();

const loading = ref(true);
const saving = ref(false);
const images = ref<any[]>([]);
const showUploadModal = ref(false);
const showEditModal = ref(false);
const showDeleteConfirm = ref(false);
const selectedImage = ref<any>(null);
const form = ref({
  url: "",
  caption: "",
  isPublic: false,
  appointmentId: "",
});

const loadImages = async () => {
  loading.value = true;
  try {
    const res = await galleryAPI.getAll({ limit: 100 });
    images.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load gallery", { error: err });
  } finally {
    loading.value = false;
  }
};

const openUploadModal = () => {
  form.value = { url: "", caption: "", isPublic: false, appointmentId: "" };
  showUploadModal.value = true;
};

const openEditModal = (item: any) => {
  selectedImage.value = item;
  form.value = {
    url: item.url,
    caption: item.caption || "",
    isPublic: item.isPublic || false,
    appointmentId: item.appointmentId || "",
  };
  showEditModal.value = true;
};

const uploadImage = async () => {
  if (!form.value.url.trim()) return;
  saving.value = true;
  try {
    await galleryAPI.create({
      ...form.value,
      appointmentId: form.value.appointmentId
        ? Number(form.value.appointmentId)
        : null,
    });
    showUploadModal.value = false;
    form.value = { url: "", caption: "", isPublic: false, appointmentId: "" };
    loadImages();
    toastStore.add(t("salon.imageUploaded", "Image uploaded"), "success");
  } catch (err) {
    logger.error("Failed to upload image", { error: err });
    toastStore.add(t("salon.uploadFailed", "Failed to upload image"), "error");
  } finally {
    saving.value = false;
  }
};

const updateImage = async () => {
  if (!selectedImage.value) return;
  saving.value = true;
  try {
    await galleryAPI.update(selectedImage.value.id, {
      caption: form.value.caption,
      isPublic: form.value.isPublic,
    });
    showEditModal.value = false;
    loadImages();
    toastStore.add(t("salon.imageUpdated", "Image updated"), "success");
  } catch (err) {
    logger.error("Failed to update image", { error: err });
    toastStore.add(t("salon.updateFailed", "Failed to update image"), "error");
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (id: number) => {
  selectedImage.value = images.value.find((img) => img.id === id);
  showDeleteConfirm.value = true;
};

const deleteImage = async () => {
  if (!selectedImage.value) return;
  try {
    await galleryAPI.delete(selectedImage.value.id);
    showDeleteConfirm.value = false;
    selectedImage.value = null;
    loadImages();
    toastStore.add(t("salon.imageDeleted", "Image deleted"), "success");
  } catch (err) {
    logger.error("Failed to delete image", { error: err });
    toastStore.add(t("salon.deleteFailed", "Failed to delete image"), "error");
  }
};

const formatDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString();
};

onMounted(loadImages);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ t("salon.gallery") }}</h1>
        <p>{{ t("salon.gallerySubtitle") }}</p>
      </div>
      <div class="topbar-right">
        <button class="btn-primary" @click="openUploadModal">
          {{ t("salon.addImageBtn", "Add Image") }}
        </button>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t("salon.loadingGallery") }}</p>
      </div>

      <div v-else class="stack">
        <div v-if="!images.length" class="empty-state">
          {{ t("salon.galleryEmpty") }}
        </div>
        <div class="gallery-grid">
          <div v-for="item in images" :key="item.id" class="gallery-item">
            <img
              :src="item.url"
              :alt="item.caption || 'Gallery image'"
              loading="lazy"
            />
            <div class="gallery-meta">
              <div class="gallery-caption">
                {{ item.caption || t("salon.untitled") }}
              </div>
              <div class="gallery-meta-row">
                <span :class="['pill', item.isPublic ? 't-true' : 't-false']">
                  {{
                    item.isPublic
                      ? t("salon.publicLabel")
                      : t("salon.privateLabel")
                  }}
                </span>
                <span class="gallery-date">{{
                  formatDate(item.createdAt)
                }}</span>
              </div>
              <div class="gallery-actions">
                <button class="btn-secondary-sm" @click="openEditModal(item)">
                  {{ t("common.edit", "Edit") }}
                </button>
                <button class="btn-danger-sm" @click="confirmDelete(item.id)">
                  {{ t("salon.deleteImage") }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showUploadModal"
      class="modal-overlay"
      @click.self="showUploadModal = false"
    >
      <div class="modal">
        <h2>{{ t("salon.addImage") }}</h2>
        <div class="form-group">
          <label class="full">
            {{ t("salon.imageUrl") }}
            <input
              v-model="form.url"
              class="field-input"
              :placeholder="t('salon.imageUrlPlaceholder')"
            />
          </label>
          <label class="full">
            {{ t("salon.caption") }}
            <input
              v-model="form.caption"
              class="field-input"
              :placeholder="t('salon.captionPlaceholder')"
            />
          </label>
          <label>
            {{ t("salon.appointmentIdOptional") }}
            <input
              v-model="form.appointmentId"
              class="field-input"
              type="number"
              :placeholder="t('salon.appointmentIdPlaceholder')"
            />
          </label>
          <label class="checkbox">
            <input v-model="form.isPublic" type="checkbox" />
            {{ t("salon.showOnPublicProfile") }}
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showUploadModal = false">
            {{ t("salon.cancelBtn", "Cancel") }}
          </button>
          <button
            class="btn-primary"
            :disabled="saving || !form.url.trim()"
            @click="uploadImage"
          >
            {{ saving ? t("salon.saving") : t("salon.addImageBtn") }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showEditModal"
      class="modal-overlay"
      @click.self="showEditModal = false"
    >
      <div class="modal">
        <h2>{{ t("salon.editImage", "Edit Image") }}</h2>
        <div class="form-group">
          <label class="full">
            {{ t("salon.caption") }}
            <input
              v-model="form.caption"
              class="field-input"
              :placeholder="t('salon.captionPlaceholder')"
            />
          </label>
          <label class="checkbox">
            <input v-model="form.isPublic" type="checkbox" />
            {{ t("salon.showOnPublicProfile") }}
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showEditModal = false">
            {{ t("salon.cancelBtn", "Cancel") }}
          </button>
          <button class="btn-primary" :disabled="saving" @click="updateImage">
            {{ saving ? t("salon.saving") : t("common.save", "Save") }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDeleteConfirm"
      class="modal-overlay"
      @click.self="showDeleteConfirm = false"
    >
      <div class="modal">
        <h2>{{ t("salon.confirmDeleteImage", "Delete Image") }}</h2>
        <p>
          {{
            t(
              "salon.confirmDeleteImageMsg",
              "Are you sure you want to delete this image?"
            )
          }}
        </p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showDeleteConfirm = false">
            {{ t("salon.cancelBtn", "Cancel") }}
          </button>
          <button class="btn-danger" :disabled="saving" @click="deleteImage">
            {{ t("common.delete", "Delete") }}
          </button>
        </div>
      </div>
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
.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
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
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
}
.spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--brand-600);
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.empty-state {
  text-align: center;
  color: var(--neutral-500);
  padding: 40px;
}
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.gallery-item {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.gallery-item img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
  background: var(--neutral-100);
}
.gallery-meta {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.gallery-caption {
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-900);
}
.gallery-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.gallery-date {
  font-size: 12px;
  color: var(--neutral-500);
}
.gallery-actions {
  display: flex;
  gap: 8px;
}
.pill {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}
.t-true {
  background: #ecfdf5;
  color: #047857;
}
.t-false {
  background: var(--neutral-100);
  color: var(--neutral-700);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: 24px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}
.modal h2 {
  font-family: var(--font-serif);
  font-size: 20px;
  margin: 0 0 16px;
}
.form-group {
  margin-bottom: 12px;
}
.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-700);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}
.form-group .full {
  grid-column: 1 / -1;
}
.field-input {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  font-size: 14px;
  background: var(--white);
  color: var(--neutral-900);
  width: 100%;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: none;
  font-size: 14px;
  color: var(--neutral-900);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}
.btn-primary {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--brand-600);
  color: var(--white);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn-danger {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: none;
  background: #fecaca;
  color: #7f1d1d;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary-sm {
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.btn-danger-sm {
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: none;
  background: #fecaca;
  color: #7f1d1d;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
</style>
