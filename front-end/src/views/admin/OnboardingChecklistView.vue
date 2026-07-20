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
        :class="{ done: step.done }"
      >
        <div class="step-check">
          <input
            type="checkbox"
            :checked="step.done"
            @change="toggleStep(idx)"
          />
        </div>
        <div class="step-content">
          <div class="step-title">{{ step.title }}</div>
          <div class="step-desc">{{ step.description }}</div>
        </div>
        <span class="step-status">{{ step.done ? "Done" : "Pending" }}</span>
      </div>
    </div>
    <div class="actions">
      <button @click="save" class="btn-primary">Save Progress</button>
      <button @click="complete" class="btn-success">Mark Complete</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import onboardingAPI from "@/services/onboardingAPI";

const route = useRoute();
const tenantId = route.params.id;
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
]);

const loadOnboarding = async () => {
  const response = await onboardingAPI.getOnboarding(tenantId);
  if (response.data.item && Array.isArray(response.data.item.steps)) {
    steps.value = response.data.item.steps;
  }
};

const toggleStep = (idx) => {
  steps.value[idx].done = !steps.value[idx].done;
};

const save = async () => {
  await onboardingAPI.updateOnboarding(tenantId, steps.value);
  alert("Progress saved");
};

const complete = async () => {
  await onboardingAPI.completeOnboarding(tenantId);
  alert("Onboarding marked as complete");
};

onMounted(() => {
  loadOnboarding();
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
