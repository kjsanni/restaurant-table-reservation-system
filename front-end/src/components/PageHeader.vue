<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

defineProps({
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
  padding: var(--space-6) var(--x-spacing-mobile) var(--space-5);
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
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--restaurant-accent),
    transparent
  );
  opacity: 0.5;
}

.header-content {
  position: relative;
  z-index: 1;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.55);
}

.breadcrumb-separator {
  opacity: 0.35;
}

.breadcrumb-item {
  color: rgba(255, 255, 255, 0.55);
}

.page-title {
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--snow-white);
  margin: 0 0 var(--space-1) 0;
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
}

.page-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
  line-height: var(--leading-relaxed);
}

@media screen and (min-width: 640px) {
  .app-page-header {
    padding: var(--space-7) var(--x-spacing-desktop) var(--space-5);
  }

  .page-title {
    font-size: var(--text-3xl);
  }

  .page-subtitle {
    font-size: var(--text-base);
  }
}

@media screen and (min-width: 1024px) {
  .app-page-header {
    padding: var(--space-8) var(--x-spacing-desktop) var(--space-6);
  }

  .page-title {
    font-size: var(--text-3xl);
  }
}
</style>
