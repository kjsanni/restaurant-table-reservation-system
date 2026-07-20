<template>
  <div class="onboarding-checklist">
    <div class="page-header">
      <h1>Onboarding Checklist</h1>
      <p class="subtitle">Track tenant setup progress</p>
    </div>
    <div class="checklist">
      <div
        v-for="(step, idx) in steps"
        :key="idx"
        class="step"
        :class="{
          done: step.policySlug ? policyAccepted(step.policySlug) : step.done,
          required: step.required,
        }"
      >
        <div class="step-check">
          <input
            type="checkbox"
            :checked="
              step.policySlug ? policyAccepted(step.policySlug) : step.done
            "
            :disabled="
              step.policySlug
                ? policyAccepted(step.policySlug) || accepting
                : step.locked
            "
            @change="toggleStep(idx)"
          />
        </div>
        <div class="step-content">
          <div class="step-title">
            {{ step.title }}
            <span v-if="step.required" class="step-tag">Required</span>
          </div>
          <div class="step-desc">{{ step.description }}</div>
          <div v-if="step.links" class="step-links">
            <RouterLink
              v-for="link in step.links"
              :key="link.slug"
              :to="{
                name: 'legal-document',
                params: { slug: link.slug },
              }"
              target="_blank"
              rel="noopener"
              >{{ link.label }}</RouterLink
            >
          </div>
          <div
            v-if="step.policySlug && policyAccepted(step.policySlug)"
            class="step-evidence"
          >
            Accepted v{{ acceptances[step.policySlug].version }} on
            {{
              new Date(acceptances[step.policySlug].acceptedAt).toLocaleString()
            }}
            <span v-if="acceptances[step.policySlug].ipAddress">
              from {{ acceptances[step.policySlug].ipAddress }}</span
            >. Record is permanent.
          </div>
        </div>
        <span class="step-status">{{
          (step.policySlug ? policyAccepted(step.policySlug) : step.done)
            ? "Accepted"
            : "Pending"
        }}</span>
      </div>
    </div>
    <p v-if="missingRequired.length" class="required-note">
      Please accept all required policies before marking onboarding complete.
    </p>
    <div class="actions">
      <button @click="save" class="btn-primary">Save Progress</button>
      <button @click="complete" class="btn-success">Mark Complete</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useToastStore } from "@/stores/toast";
import onboardingAPI from "@/services/onboardingAPI";
import legalAcceptanceAPI, {
  LEGAL_DOCUMENT_VERSIONS,
} from "@/services/legalAcceptanceAPI";

const toastStore = useToastStore();

const route = useRoute();
const tenantId = route.params.id;

// Required policy steps are driven by the immutable server-side acceptance
// record (versioned, with IP + timestamp) — not by a local checkbox.
const REQUIRED_POLICY_SLUGS = ["tenant", "dpa"];
const acceptances = ref({}); // slug -> { version, acceptedAt, ipAddress }
const accepting = ref(false);

const steps = ref([
  {
    title: "Add Tables",
    description: "Create tables in the floor plan",
    done: false,
  },
  {
    title: "Create Staff",
    description: "Add staff accounts and assign roles",
    done: false,
  },
  {
    title: "Configure Schedule",
    description: "Set business hours and holidays",
    done: false,
  },
  {
    title: "Set Up Payments",
    description: "Configure payment methods and POS sync",
    done: false,
  },
  {
    title: "Customize Branding",
    description: "Upload logo and set primary color",
    done: false,
  },
  {
    title: "Accept Merchant Policy",
    description:
      "As the restaurant, you are an independent data controller under Ghana's Data Protection Act, 2012. Accept the Merchant Policy before going live.",
    done: false,
    required: true,
    policySlug: "tenant",
    links: [{ slug: "tenant", label: "Read Merchant Policy" }],
  },
  {
    title: "Accept Data Processing Agreement",
    description:
      "Accept the DPA governing how Vibespot Technologies Ltd. processes your guests' and staff's data as your processor.",
    done: false,
    required: true,
    policySlug: "dpa",
    links: [{ slug: "dpa", label: "Read Data Processing Agreement" }],
  },
]);

// A required policy step is "done" only when the server has a current-version
// acceptance record for that slug.
const policyAccepted = (slug) => {
  const rec = acceptances.value[slug];
  return !!(rec && rec.version === LEGAL_DOCUMENT_VERSIONS[slug]);
};

const missingRequired = computed(() =>
  steps.value
    .filter((s) => s.required && !policyAccepted(s.policySlug))
    .map((s) => s.title)
);

const loadOnboarding = async () => {
  const response = await onboardingAPI.getOnboarding(tenantId);
  if (response.data.item && Array.isArray(response.data.item.steps)) {
    const saved = response.data.item.steps;
    steps.value = steps.value.map((base) => {
      if (base.policySlug) return base; // policy steps come from server record
      const match = saved.find((s) => s.title === base.title);
      return match ? { ...base, done: !!match.done } : base;
    });
  }
};

const loadAcceptances = async () => {
  try {
    const response = await legalAcceptanceAPI.getAcceptances(tenantId);
    const map = {};
    (response.data.items || []).forEach((item) => {
      // keep the latest acceptance per slug
      if (
        !map[item.slug] ||
        new Date(item.acceptedAt) > new Date(map[item.slug].acceptedAt)
      ) {
        map[item.slug] = item;
      }
    });
    acceptances.value = map;
  } catch (err) {
    console.warn("Failed to load legal acceptances", err);
  }
};

const toggleStep = (idx) => {
  const step = steps.value[idx];
  if (step.policySlug) {
    // toggling a required policy on records the acceptance server-side
    if (!policyAccepted(step.policySlug)) {
      acceptPolicy(step.policySlug);
    }
    return;
  }
  steps.value[idx].done = !steps.value[idx].done;
};

const acceptPolicy = async (slug) => {
  accepting.value = true;
  try {
    const response = await legalAcceptanceAPI.acceptDocument(tenantId, slug);
    acceptances.value = {
      ...acceptances.value,
      [slug]: {
        version: response.data.item.version,
        acceptedAt: response.data.item.acceptedAt,
        ipAddress: response.data.item.ipAddress,
      },
    };
  } catch (err) {
    toastStore.add(
      "Failed to record policy acceptance. Please try again.",
      "error",
      4000
    );
  } finally {
    accepting.value = false;
  }
};

const save = async () => {
  await onboardingAPI.updateOnboarding(
    tenantId,
    steps.value
      .filter((s) => !s.policySlug)
      .map((s) => ({
        title: s.title,
        description: s.description,
        done: s.done,
      }))
  );
  toastStore.add("Progress saved", "success", 3000);
};

const complete = async () => {
  if (missingRequired.value.length) {
    toastStore.add(
      "Please accept all required policies before marking onboarding complete.",
      "error",
      4000
    );
    return;
  }
  if (accepting.value) {
    toastStore.add(
      "Please wait for policy acceptance to finish.",
      "error",
      4000
    );
    return;
  }
  await onboardingAPI.completeOnboarding(tenantId);
  toastStore.add("Onboarding marked as complete", "success", 3000);
};

onMounted(() => {
  loadOnboarding();
  loadAcceptances();
});
</script>

<style scoped>
.onboarding-checklist {
  padding: var(--space-6);
}
.page-header {
  margin-bottom: var(--space-6);
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
  margin: 0 0 var(--space-1) 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
}
.checklist {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.step {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}
.step.done {
  border-color: var(--earth-400);
  background: var(--earth-50);
}
.step-check input[type="checkbox"] {
  width: 20px;
  height: 20px;
  accent-color: var(--accent);
}
.step-content {
  flex: 1;
}
.step-title {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-base);
  color: var(--ink);
}
.step-desc {
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
.step-status {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--neutral-500);
}
.step.done .step-status {
  color: var(--earth-600);
}
.step-tag {
  display: inline-block;
  margin-left: var(--space-2);
  padding: 1px var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-2xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  background: var(--accent-100);
  color: var(--accent-600);
  vertical-align: middle;
}
.step-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  margin-top: var(--space-2);
}
.step-links a {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--accent-600);
  text-decoration: none;
}
.step-links a:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}
.step-evidence {
  margin-top: var(--space-2);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--earth-600);
  background: var(--earth-50);
  border: 1px solid var(--earth-200);
  border-radius: var(--radius-md);
  padding: var(--space-1) var(--space-2);
  line-height: 1.4;
}
.required-note {
  margin-top: var(--space-4);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--rose-600);
}
.actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(
    135deg,
    var(--brand-700) 0%,
    var(--brand-600) 100%
  );
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  font-family: var(--font-sans);
}
.btn-success {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(
    135deg,
    var(--earth-500) 0%,
    var(--earth-600) 100%
  );
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  font-family: var(--font-sans);
}
</style>
