<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";

const props = defineProps<{
  modelValue?: string;
  siteKey?: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  expired: [];
  error: [];
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const widgetId = ref<string | null>(null);
const scriptLoaded = ref(false);

const loadScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).turnstile) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile script"));
    document.head.appendChild(script);
  });
};

const renderWidget = async () => {
  if (!containerRef.value || widgetId.value) return;

  try {
    await loadScript();
    const turnstile = (window as any).turnstile;
    if (!turnstile || !containerRef.value) return;

    widgetId.value = turnstile.render(containerRef.value, {
      sitekey: props.siteKey || "",
      theme: props.theme || "auto",
      size: props.size || "normal",
      callback: (token: string) => {
        emit("update:modelValue", token);
      },
      "expired-callback": () => {
        emit("update:modelValue", "");
        emit("expired");
      },
      "error-callback": () => {
        emit("update:modelValue", "");
        emit("error");
      },
    });
    scriptLoaded.value = true;
  } catch {
    emit("error");
  }
};

const reset = () => {
  if (widgetId.value && (window as any).turnstile) {
    (window as any).turnstile.reset(widgetId.value);
  }
};

watch(
  () => props.siteKey,
  () => {
    if (widgetId.value && (window as any).turnstile) {
      (window as any).turnstile.remove(widgetId.value);
      widgetId.value = null;
      if (containerRef.value) {
        containerRef.value.innerHTML = "";
      }
      renderWidget();
    }
  }
);

onMounted(() => {
  renderWidget();
});

onBeforeUnmount(() => {
  if (widgetId.value && (window as any).turnstile) {
    try {
      (window as any).turnstile.remove(widgetId.value);
    } catch {
      // ignore cleanup errors
    }
  }
});

defineExpose({ reset });
</script>

<template>
  <div ref="containerRef" class="turnstile-widget" />
</template>

<style scoped>
.turnstile-widget {
  margin: 12px 0;
  display: flex;
  justify-content: center;
}
</style>
