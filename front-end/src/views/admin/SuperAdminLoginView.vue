<script setup lang="ts">
import { onMounted } from "vue";
import LoginView from "@/views/LoginView.vue";

defineOptions({ name: "SuperAdminLoginView" });

onMounted(() => {
  document.title = "Platform Administration";
});
</script>

<template>
  <LoginView mode="super-admin" />
</template>
