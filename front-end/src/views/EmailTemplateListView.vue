<script setup>
import { ref, onMounted } from "vue";
import emailTemplateAPI from "@/services/emailTemplateAPI";
import { getApiErrorMessage } from "@/utils/apiError";
import logger from "@/utils/logger";

const templates = ref([]);
const loading = ref(true);
const error = ref("");

const loadTemplates = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await emailTemplateAPI.getAll();
    templates.value = res.data.templates;
  } catch (err) {
    error.value = getApiErrorMessage(err, "Failed to load email templates");
    logger.error("Failed to load email templates", { error: err.message });
  } finally {
    loading.value = false;
  }
};

onMounted(loadTemplates);

const toggleActive = async (template) => {
  try {
    await emailTemplateAPI.update(template.id, {
      isActive: !template.isActive,
    });
    template.isActive = !template.isActive;
  } catch (err) {
    logger.error("Failed to toggle template", { error: err.message });
  }
};
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <h1>Email Templates</h1>
    </div>
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading templates...</p>
      </div>
      <div v-else-if="error" class="error-state">
        {{ error }}
      </div>
      <div v-else class="templates-container">
        <table class="templates-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Subject</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="template in templates" :key="template.id">
              <td>{{ template.name }}</td>
              <td>
                <code>{{ template.key }}</code>
              </td>
              <td>{{ template.subject }}</td>
              <td>
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    :checked="template.isActive"
                    @change="toggleActive(template)"
                  />
                  <span class="slider"></span>
                </label>
              </td>
              <td>
                <router-link
                  :to="`/admin/email-templates/${template.id}`"
                  class="edit-link"
                >
                  Edit
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--lighter-gray);
}

.header {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  height: var(--header-height);
  background: var(--lighter-gray) url("@/assets/images/reservations-header.jpg");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

.header h1 {
  margin-left: var(--x-spacing-mobile);
  margin-bottom: 15px;
  font-size: 35px;
  color: var(--snow-white);
  text-shadow: 1px 1px 2px var(--primary-black);
}

.content-wrapper {
  margin-top: var(--page-margin-y);
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
  padding: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--lighter-gray);
  border-top-color: var(--primary-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.templates-table {
  width: 100%;
  background: white;
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  border-collapse: collapse;
}

.templates-table th,
.templates-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--lighter-gray);
}

.templates-table th {
  font-family: "Inter-Bold";
  font-size: 13px;
  text-transform: uppercase;
  color: var(--secondary-gray);
}

.templates-table td {
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--primary-black);
}

.templates-table code {
  background: var(--lighter-gray);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.2s;
  border-radius: 20px;
}

.slider::before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

.toggle-switch input:checked + .slider {
  background-color: var(--primary-blue);
}

.toggle-switch input:checked + .slider::before {
  transform: translateX(20px);
}

.edit-link {
  color: var(--primary-blue);
  text-decoration: none;
  font-family: "Inter-Medium";
}

.edit-link:hover {
  text-decoration: underline;
}
</style>
