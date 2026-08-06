<script setup lang="ts">
import { ref, onMounted } from "vue";
import galleryAPI from "@/services/galleryAPI";
import logger from "@/utils/logger";
import { useI18n } from "@/composables/useI18n";

const { t } = useI18n();

const loading = ref(true);
const saving = ref(false);
const images = ref<any[]>([]);
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
    form.value = { url: "", caption: "", isPublic: false, appointmentId: "" };
    loadImages();
  } catch (err) {
    logger.error("Failed to upload image", { error: err });
  } finally {
    saving.value = false;
  }
};

const deleteImage = async (id: number) => {
  if (!confirm("Delete this image?")) return;
  try {
    await galleryAPI.delete(id);
    loadImages();
  } catch (err) {
    logger.error("Failed to delete image", { error: err });
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
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t("salon.loadingGallery") }}</p>
      </div>

      <div v-else class="stack">
        <div class="settings-card">
          <h3>{{ t("salon.addImage") }}</h3>
          <div class="grid">
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
          <div class="form-actions">
            <button
              class="btn-primary"
              :disabled="saving || !form.url.trim()"
              @click="uploadImage"
            >
              {{ saving ? t("salon.saving") : t("salon.addImageBtn") }}
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>{{ t("salon.galleryTitle") }}</h3>
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
                <button class="btn-danger-sm" @click="deleteImage(item.id)">
                  {{ t("salon.deleteImage") }}
                </button>
              </div>
            </div>
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
.settings-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}
.settings-card h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 14px;
  color: var(--neutral-900);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.grid label {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-700);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.full {
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
  flex-direction: row;
  align-items: center;
  gap: 10px;
  text-transform: none;
  font-size: 14px;
  color: var(--neutral-900);
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
.empty-state {
  text-align: center;
  color: var(--neutral-500);
  padding: 24px;
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
