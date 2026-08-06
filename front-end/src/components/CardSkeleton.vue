<script setup></script>

<template>
  <div class="card-skeleton">
    <div class="skeleton-media"></div>
    <div class="skeleton-body">
      <div class="skeleton-line skeleton-title"></div>
      <div class="skeleton-line skeleton-text"></div>
      <div class="skeleton-line skeleton-text short"></div>
    </div>
  </div>
</template>

<style scoped>
.card-skeleton {
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
}
.skeleton-media {
  height: 160px;
  background: linear-gradient(
    90deg,
    var(--surface-muted) 25%,
    var(--border-subtle) 50%,
    var(--surface-muted) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.skeleton-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.skeleton-line {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--surface-muted) 25%,
    var(--border-subtle) 50%,
    var(--surface-muted) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.skeleton-line.short {
  width: 60%;
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
