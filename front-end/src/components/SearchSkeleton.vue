<script setup></script>

<template>
  <div class="search-skeleton">
    <div class="skeleton-line"></div>
    <div class="skeleton-line short"></div>
  </div>
</template>

<style scoped>
.search-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
}
.skeleton-line {
  height: 16px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
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
