<template>
  <div class="event-photo-upload">
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileChange"
    />
    <button
      type="button"
      class="btn-photo-upload"
      v-tap-scale
      :disabled="uploading"
      @click="triggerFileInput"
    >
      <span class="mdi mdi:camera"></span>
      {{ uploading ? "Uploading..." : label }}
    </button>
    <img
      v-if="previewUrl"
      :src="previewUrl"
      :alt="alt"
      class="photo-preview"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useToastStore } from "@/stores/toast";
import eventPortalAPI from "@/services/eventPortalAPI";

const props = defineProps<{
  eventId: number;
  label?: string;
  alt?: string;
  modelValue?: string | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", photoRef: string | null): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const previewUrl = ref<string | null>(props.modelValue || null);

const toast = useToastStore();

const triggerFileInput = () => {
  fileInput.value?.click();
};

const onFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append("photo", file);

    const res = await eventPortalAPI.uploadEventPhoto(props.eventId, formData);
    const photoRef = res.data?.photoRef || null;
    previewUrl.value = photoRef ? eventPortalAPI.getPhotoUrl(photoRef) : null;
    emit("update:modelValue", photoRef);
    toast.add("Photo uploaded", "success", 3000);
  } catch (err) {
    toast.add("Failed to upload photo", "error", 4000);
  } finally {
    uploading.value = false;
    target.value = "";
  }
};
</script>

<style scoped>
.event-photo-upload {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hidden {
  display: none;
}

.btn-photo-upload {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-photo-upload:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.photo-preview {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border);
}
</style>
