<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import LandingFooter from "@/components/LandingFooter.vue";

const router = useRouter();
const content = ref<string | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const response = await fetch("/api/v1/public/changelog");
    const data = await response.json();
    if (data.success) {
      content.value = data.content;
    } else {
      error.value = "Unable to load changelog.";
    }
  } catch {
    error.value = "Unable to load changelog. Please try again later.";
  } finally {
    loading.value = false;
  }
});

const parsedSections = computed(() => {
  if (!content.value) return [];
  const lines = content.value.split("\n");
  const sections: { version: string; date: string; items: string[] }[] = [];
  let current: { version: string; date: string; items: string[] } | null = null;

  for (const line of lines) {
    const versionMatch = line.match(/^## \[(.+?)\](?: — (.+))?/);
    if (versionMatch) {
      if (current) sections.push(current);
      current = {
        version: versionMatch[1],
        date: versionMatch[2] || "",
        items: [],
      };
    } else if (line.startsWith("- ") && current) {
      current.items.push(line.slice(2));
    }
  }
  if (current) sections.push(current);
  return sections;
});
</script>

<template>
  <div class="changelog-root">
    <nav class="changelog-nav">
      <div class="nav-inner">
        <div class="nav-brand" @click="router.push('/')">
          <Icon icon="mdi:silverware-fork-knife" width="24" height="24" />
          <span>Vibespot</span>
        </div>
        <div class="nav-links">
          <button class="nav-link" @click="router.push('/')">Home</button>
          <button class="nav-link" @click="router.push('/pricing')">
            Pricing
          </button>
          <button class="nav-link" @click="router.push('/status')">
            Status
          </button>
          <button class="nav-link active">Changelog</button>
          <button class="nav-link" @click="router.push('/legal')">Legal</button>
        </div>
      </div>
    </nav>

    <main class="changelog-main">
      <div class="changelog-container">
        <h1>Changelog</h1>
        <p class="changelog-subtitle">
          All notable changes to the Restaurant Table Reservation System.
        </p>

        <div v-if="loading" class="loading-state">Loading changelog...</div>
        <div v-else-if="error" class="error-state">{{ error }}</div>

        <div v-else class="releases">
          <div
            v-for="section in parsedSections"
            :key="section.version"
            class="release-card"
          >
            <div class="release-header">
              <span class="release-version">{{ section.version }}</span>
              <span v-if="section.date" class="release-date">{{
                section.date
              }}</span>
            </div>
            <ul class="release-items">
              <li
                v-for="(item, idx) in section.items"
                :key="idx"
                class="release-item"
              >
                {{ item }}
              </li>
            </ul>
          </div>
        </div>

        <LandingFooter />
      </div>
    </main>
  </div>
</template>

<style scoped>
.changelog-root {
  min-height: 100vh;
  background: #faf9f7;
  color: #312e2a;
  font-family:
    "Public Sans",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
}
.changelog-nav {
  background: #1a1410;
  padding: 0.75rem 1.5rem;
}
.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.nav-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
}
.nav-links {
  display: flex;
  gap: 1rem;
}
.nav-link {
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.nav-link:hover {
  color: #fff;
  border-color: #475569;
}
.nav-link.active {
  color: #fff;
  border-color: #d97706;
}
.changelog-main {
  padding: 3rem 1.5rem;
}
.changelog-container {
  max-width: 800px;
  margin: 0 auto;
}
.changelog-container h1 {
  margin: 0 0 0.5rem;
  font-size: 2.5rem;
  color: #1a1410;
}
.changelog-subtitle {
  margin: 0 0 2rem;
  color: #645d54;
  font-size: 1rem;
}
.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  color: #645d54;
}
.release-card {
  background: #fff;
  border: 1px solid #e7e4de;
  border-radius: 0.6rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
}
.release-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.release-version {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1410;
}
.release-date {
  color: #7d766c;
  font-size: 0.85rem;
}
.release-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.release-item {
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.5;
}
.release-item::before {
  content: "• ";
  color: #d97706;
  font-weight: bold;
}
</style>
