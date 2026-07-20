<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

defineProps({
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  variant: { type: String, default: "dark" },
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
  <header
    class="app-page-header"
    :class="{ 'is-light': variant === 'light' }"
    role="banner"
  >
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
  padding: var(--space-6) var(--space-6) var(--space-5);
  background: linear-gradient(
    135deg,
    var(--brand-900) 0%,
    var(--brand-800) 100%
  );
  position: relative;
  overflow: hidden;
}
.app-page-header.is-light {
  background: transparent;
  padding: var(--space-6) var(--space-6) 0;
}
.app-page-header.is-light::before,
.app-page-header.is-light::after {
  display: none;
}
.app-page-header.is-light .page-title {
  color: var(--neutral-900);
  text-shadow: none;
}
.app-page-header.is-light .page-subtitle {
  color: var(--neutral-600);
}
.app-page-header.is-light .breadcrumbs {
  color: var(--neutral-600);
}

.app-page-header::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
      ellipse at 0% 0%,
      rgba(217, 119, 6, 0.12) 0%,
      transparent 55%
    ),
    radial-gradient(
      ellipse at 100% 100%,
      rgba(180, 83, 9, 0.08) 0%,
      transparent 55%
    );
  pointer-events: none;
}

.app-page-header::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(217, 119, 6, 0.35),
    transparent
  );
}

.header-content {
  position: relative;
  z-index: 1;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: var(--tracking-wide);
}

.breadcrumb-separator {
  opacity: 0.4;
  font-weight: 300;
}

.breadcrumb-item {
  color: rgba(255, 255, 255, 0.55);
}

.page-title {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 var(--space-2) 0;
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-snug);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.page-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: var(--leading-relaxed);
  max-width: 640px;
}

@media screen and (min-width: 640px) {
  .app-page-header {
    padding: var(--space-8) var(--space-8) var(--space-6);
  }

  .page-title {
    font-size: var(--text-4xl);
  }

  .page-subtitle {
    font-size: var(--text-base);
  }
}

@media screen and (min-width: 1024px) {
  .app-page-header {
    padding: var(--space-10) var(--space-10) var(--space-8);
  }

  .page-title {
    font-size: 42px;
  }
}
</style>
