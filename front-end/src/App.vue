<script setup>
import TheSidebar from "@/components/TheSidebar.vue";
import TheFooter from "@/components/TheFooter.vue";
</script>

<template>
  <div class="wrapper">
    <TheSidebar />
    <main>
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.name" />
        </Transition>
      </RouterView>
    </main>
    <TheFooter />
  </div>
</template>

<style scoped>
main {
  background-color: var(--light-pink);
  margin-top: var(--top-spacing);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease-out;
}
</style>
