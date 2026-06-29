<script setup>
import TextBox from "@/components/TextBox.vue";
import ButtonFilled from "@/components/ButtonFilled.vue";
import SuccessMessage from "@/components/SuccessMessage.vue";
import ErrorMessage from "@/components/ErrorMessage.vue";

import RegisterIcon from "~icons/fluent/person-add-16-regular";

import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { getApiErrorMessage, getApiErrors } from "@/utils/apiError";

const router = useRouter();
const authStore = useAuthStore();

const user = ref({
  username: "",
  email: "",
  password: "",
});

const validationErrors = ref(null);
const isSuccessful = ref(false);
const generalError = ref(null);
const registrationEnabled = ref(true);

onMounted(async () => {
  registrationEnabled.value = await authStore.fetchRegistrationStatus();
});

const handleRegister = async () => {
  isSuccessful.value = false;
  validationErrors.value = null;
  generalError.value = null;

  if (!registrationEnabled.value) {
    generalError.value = "Registration is currently disabled!";
    return;
  }

  try {
    await authStore.register(
      user.value.username,
      user.value.email,
      user.value.password
    );
    isSuccessful.value = true;
    setTimeout(() => router.push("/login"), 2000);
  } catch (err) {
    generalError.value = getApiErrorMessage(err);
    validationErrors.value = getApiErrors(err);
  }
};
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <h1>Register</h1>
    </div>
    <div class="form-wrapper">
      <form @submit.prevent="handleRegister">
        <TextBox
          text-box-type="text"
          id="username"
          label-text="Username"
          placeholder-text="Enter your username..."
          :errors="validationErrors"
          v-model:input="user.username"
        />
        <TextBox
          text-box-type="email"
          id="email"
          label-text="Email Address"
          placeholder-text="Enter your email address..."
          :errors="validationErrors"
          v-model:input="user.email"
        />
        <TextBox
          text-box-type="password"
          id="password"
          label-text="Password"
          placeholder-text="Enter your password..."
          :errors="validationErrors"
          v-model:input="user.password"
        />
        <SuccessMessage
          :is-successful="isSuccessful"
          success-message="Successfully registered! Redirecting to login..."
        />
        <ErrorMessage
          :error-flag="generalError"
          :error-message="generalError"
        />
        <ButtonFilled
          class="button"
          text="Register"
          :disabled="!registrationEnabled"
        >
          <template #icon><RegisterIcon /></template>
        </ButtonFilled>
      </form>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  height: var(--header-height);
  background: var(--lighter-gray) url("@/assets/images/add-table-header.jpg");
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
.form-wrapper {
  display: flex;
  justify-content: center;
  margin-top: var(--page-margin-y);
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
  align-items: center;
  background-color: var(--primary-white);
  padding: var(--card-padding);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}
form {
  width: 80%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
.button {
  width: 200px;
}

@media screen and (min-width: 1024px) {
  .form-wrapper {
    margin: 50px var(--x-spacing-desktop) var(--x-spacing-desktop) 50px;
  }
  .header h1 {
    margin-left: var(--x-spacing-desktop);
    font-size: 45px;
    margin-bottom: 20px;
  }
}
</style>
