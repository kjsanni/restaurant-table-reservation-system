<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const props = defineProps({
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
});

const route = useRoute();

const breadcrumbs = computed(() => {
  const matched = route.matched.filter((record) => record.meta?.title);
  return matched.map((record) => ({
    path: record.path,
    title: record.meta.title,
  }));
});
</script>

<template>
  <header class="app-page-header" role="banner">
    <div class="header-content">
      <div
        v-if="breadcrumbs.length > 1"
        class="breadcrumbs"
        aria-label="Breadcrumb"
      >
        <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
          <span v-if="index > 0" class="breadcrumb-separator" aria-hidden="true"
            >/</span
          >
          <span class="breadcrumb-item">{{ crumb.title }}</span>
        </template>
      </div>
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    </div>
  </header>
</template>

<style scoped>
.app-page-header {
  width: 100%;
  padding: 24px var(--x-spacing-mobile) 16px;
  background: linear-gradient(
    135deg,
    var(--luxury-charcoal, var(--restaurant-primary)) 0%,
    var(--luxury-slate, var(--darker-gray)) 100%
  );
  position: relative;
  overflow: hidden;
}

.app-page-header::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--restaurant-accent),
    transparent
  );
  opacity: 0.6;
}

.header-content {
  position: relative;
  z-index: 1;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-family: "Inter-Medium";
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.breadcrumb-separator {
  opacity: 0.4;
}

.breadcrumb-item {
  color: rgba(255, 255, 255, 0.6);
}

.page-title {
  font-family: "Inter-Bold";
  font-size: 28px;
  font-weight: 700;
  color: var(--snow-white);
  margin: 0 0 4px 0;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.page-subtitle {
  font-family: "Inter-Light";
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

@media screen and (min-width: 640px) {
  .app-page-header {
    padding: 28px var(--x-spacing-desktop) 20px;
  }

  .page-title {
    font-size: 32px;
  }

  .page-subtitle {
    font-size: 15px;
  }
}

@media screen and (min-width: 1024px) {
  .app-page-header {
    padding: 32px var(--x-spacing-desktop) 24px;
  }

  .page-title {
    font-size: 36px;
  }
}
</style>
