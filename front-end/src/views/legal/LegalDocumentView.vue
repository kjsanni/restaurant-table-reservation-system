<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { legalDocuments, legalDocumentSlugs } from "@/config/legalDocuments";

const route = useRoute();
const router = useRouter();

const slug = computed(() => String(route.params.slug || ""));
const doc = computed(() => legalDocuments[slug.value]);

const availableDocs = computed(() =>
  legalDocumentSlugs.map((s) => ({
    slug: s,
    title: legalDocuments[s].title,
  }))
);

function goTo(target: string) {
  router.push({ name: "legal-document", params: { slug: target } });
}
</script>

<template>
  <div class="legal-page" v-if="doc">
    <div class="legal-shell">
      <aside class="legal-nav" aria-label="Legal documents">
        <h2 class="legal-nav-title">Legal</h2>
        <nav>
          <button
            v-for="item in availableDocs"
            :key="item.slug"
            class="legal-nav-item"
            :class="{ active: item.slug === slug }"
            @click="goTo(item.slug)"
          >
            {{ item.title }}
          </button>
        </nav>
      </aside>

      <article class="legal-content" :aria-labelledby="`legal-title-${slug}`">
        <header class="legal-header">
          <p class="legal-eyebrow">Legal &amp; Compliance</p>
          <h1 :id="`legal-title-${slug}`" class="legal-title">
            {{ doc.title }}
          </h1>
          <p class="legal-updated">Last updated: {{ doc.lastUpdated }}</p>
          <p class="legal-desc">{{ doc.description }}</p>
        </header>

        <section
          v-for="(section, index) in doc.sections"
          :key="index"
          class="legal-section"
        >
          <h2 class="legal-section-title">{{ section.heading }}</h2>
          <p class="legal-section-body" v-html="section.body"></p>
        </section>

        <footer class="legal-footer">
          <p>
            Vibespot Technologies Ltd. — Restaurant Table Reservation System.
          </p>
        </footer>
      </article>
    </div>
  </div>

  <div class="legal-page" v-else>
    <div class="legal-shell legal-notfound">
      <h1 class="legal-title">Document not found</h1>
      <p class="legal-desc">The legal document you requested does not exist.</p>
      <RouterLink :to="{ name: 'legal-document', params: { slug: 'privacy' } }">
        View the Privacy Policy
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.legal-page {
  display: flex;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
}

.legal-shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: var(--space-8);
  width: 100%;
  max-width: 1080px;
}

.legal-nav {
  position: sticky;
  top: var(--space-6);
  align-self: start;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
}

.legal-nav-title {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink-muted);
  margin: 0 0 var(--space-4);
  font-weight: 700;
}

.legal-nav nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.legal-nav-item {
  text-align: left;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ink-muted);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-in-out);
}

.legal-nav-item:hover {
  background: var(--brand-50);
  color: var(--ink);
}

.legal-nav-item.active {
  background: var(--accent-100);
  color: var(--accent-600);
  font-weight: 600;
}

.legal-content {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  min-width: 0;
}

.legal-header {
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--space-6);
  margin-bottom: var(--space-6);
}

.legal-eyebrow {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent-600);
  font-weight: 700;
  margin: 0 0 var(--space-2);
}

.legal-title {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 var(--space-3);
  letter-spacing: var(--tracking-tight);
}

.legal-updated {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin: 0 0 var(--space-4);
}

.legal-desc {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--ink-muted);
  line-height: 1.6;
  margin: 0;
}

.legal-section {
  margin-bottom: var(--space-6);
}

.legal-section-title {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 var(--space-2);
  letter-spacing: var(--tracking-tight);
}

.legal-section-body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.7;
  color: var(--ink-soft);
  margin: 0;
}

.legal-section-body :deep(a) {
  color: var(--accent-600);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.legal-section-body :deep(strong) {
  color: var(--ink);
  font-weight: 700;
}

.legal-footer {
  border-top: 1px solid var(--border-subtle);
  padding-top: var(--space-5);
  margin-top: var(--space-6);
}

.legal-footer p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin: 0;
}

.legal-notfound {
  grid-template-columns: 1fr;
  text-align: center;
  place-items: center;
}

.legal-notfound a {
  color: var(--accent-600);
  font-family: var(--font-sans);
  font-weight: 600;
  text-decoration: underline;
}

@media screen and (max-width: 768px) {
  .legal-shell {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .legal-nav {
    position: static;
  }

  .legal-content {
    padding: var(--space-5);
  }
}
</style>
