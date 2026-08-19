<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import LandingFooter from "@/components/LandingFooter.vue";

const router = useRouter();
const searchQuery = ref("");

const faqItems = [
  {
    id: 1,
    question: "How do I make a reservation?",
    answer:
      "Visit the booking page, select your preferred date and time, choose a table for your party size, and enter your contact details. You'll receive a confirmation via email or WhatsApp.",
    category: "Reservations",
  },
  {
    id: 2,
    question: "Can I change or cancel my reservation?",
    answer:
      "Yes. Reservations can be cancelled or rescheduled up to 2 hours before the scheduled time. Visit 'My Reservations' in your profile or contact the restaurant directly.",
    category: "Reservations",
  },
  {
    id: 3,
    question: "What payment methods are accepted?",
    answer:
      "We accept Ghanaian Mobile Money (MTN, Vodafone, AirtelTigo), debit/credit cards (Visa/Mastercard), and cash on arrival. All payments are processed securely through Paystack.",
    category: "Payments",
  },
  {
    id: 4,
    question: "Do you offer table merging for large parties?",
    answer:
      "Yes. For parties larger than 6, our system can automatically link multiple tables. This can be configured in the floor plan settings.",
    category: "Reservations",
  },
  {
    id: 5,
    question: "Is my data secure?",
    answer:
      "Yes. We comply with the Ghana Data Protection Act 2012 (Act 843). All personal data is encrypted in transit and at rest, and we maintain a tamper-evident legal acceptance trail.",
    category: "Privacy",
  },
  {
    id: 6,
    question: "How do I enable WhatsApp notifications?",
    answer:
      "WhatsApp notifications can be enabled in your account settings under 'Notification Preferences'. You'll need to verify your phone number.",
    category: "Notifications",
  },
  {
    id: 7,
    question: "Can I book for a salon service?",
    answer:
      "Yes. Salon tenants can book appointments with specific stylists, select services, and manage recurring bookings. The customer portal supports both restaurant and salon workflows.",
    category: "Salon",
  },
  {
    id: 8,
    question: "How do I reset my password?",
    answer:
      "Click 'Forgot Password' on the login page, enter your email address, and we'll send a reset link. The link is valid for 1 hour.",
    category: "Account",
  },
  {
    id: 9,
    question: "Where can I find API and webhook documentation?",
    answer:
      "You can view the REST API reference at /api-docs and webhook integration docs at /webhook-docs. Both are publicly accessible.",
    category: "Integrations",
  },
  {
    id: 10,
    question: "How do I export my tenant data?",
    answer:
      "Tenant admins can export tenant data from Settings > Data > Export Tenant Data. The export includes settings, notes, and legal acceptances in JSON format.",
    category: "Account",
  },
  {
    id: 11,
    question: "What is the deposit and cancellation policy?",
    answer:
      "Some reservations require a deposit. Cancellation policies vary by tenant. You can review the specific policy during checkout before confirming your booking.",
    category: "Reservations",
  },
  {
    id: 12,
    question: "How do I contact support?",
    answer:
      "Use the in-app support ticket system or email support@vibespot.com. For urgent issues, WhatsApp support is available during business hours.",
    category: "Account",
  },
];

const categories = [
  "All",
  "Reservations",
  "Payments",
  "Privacy",
  "Notifications",
  "Salon",
  "Account",
  "Integrations",
];
const activeCategory = ref("All");

const filteredItems = computed(() => {
  return faqItems.filter((item) => {
    const matchesSearch =
      searchQuery.value === "" ||
      item.question.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesCategory =
      activeCategory.value === "All" || item.category === activeCategory.value;
    return matchesSearch && matchesCategory;
  });
});
</script>

<template>
  <div class="help-root">
    <nav class="help-nav">
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
          <button class="nav-link" @click="router.push('/changelog')">
            Changelog
          </button>
          <button class="nav-link active">Help</button>
          <button class="nav-link" @click="router.push('/legal')">Legal</button>
          <button class="nav-link" @click="router.push('/webhook-docs')">
            Webhooks
          </button>
        </div>
      </div>
    </nav>

    <main class="help-main">
      <div class="help-container">
        <h1>Help Center</h1>
        <p class="help-subtitle">
          Find answers to common questions about reservations, payments, and
          account settings.
        </p>

        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search for articles..."
            class="search-input"
          />
          <Icon icon="mdi:magnify" width="20" height="20" class="search-icon" />
        </div>

        <div class="category-filter">
          <button
            v-for="cat in categories"
            :key="cat"
            :class="['cat-btn', { active: activeCategory === cat }]"
            @click="activeCategory = cat"
          >
            {{ cat }}
          </button>
        </div>

        <div v-if="filteredItems.length === 0" class="empty-state">
          No articles found. Try adjusting your search or category filter.
        </div>

        <div v-else class="faq-list">
          <div v-for="item in filteredItems" :key="item.id" class="faq-item">
            <h3 class="faq-question">{{ item.question }}</h3>
            <p class="faq-answer">{{ item.answer }}</p>
            <span class="faq-category">{{ item.category }}</span>
          </div>
        </div>

        <LandingFooter />
      </div>
    </main>
  </div>
</template>

<style scoped>
.help-root {
  min-height: 100vh;
  background: #faf9f7;
  color: #312e2a;
  font-family:
    "Public Sans",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}
.help-nav {
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
.help-main {
  padding: 3rem 1.5rem;
}
.help-container {
  max-width: 800px;
  margin: 0 auto;
}
.help-container h1 {
  margin: 0 0 0.5rem;
  font-size: 2.5rem;
  color: #1a1410;
}
.help-subtitle {
  margin: 0 0 2rem;
  color: #645d54;
  font-size: 1rem;
}
.search-bar {
  position: relative;
  margin-bottom: 1.5rem;
}
.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e7e4de;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
  background: #fff;
  color: #312e2a;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus {
  border-color: #d97706;
}
.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}
.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.cat-btn {
  background: #fff;
  border: 1px solid #e7e4de;
  color: #645d54;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.4rem 0.85rem;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.cat-btn:hover {
  color: #1a1410;
  border-color: #d97706;
}
.cat-btn.active {
  background: #d97706;
  color: #fff;
  border-color: #d97706;
}
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #645d54;
  font-size: 1rem;
}
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.faq-item {
  background: #fff;
  border: 1px solid #e7e4de;
  border-radius: 0.6rem;
  padding: 1.25rem 1.5rem;
  position: relative;
}
.faq-question {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: #1a1410;
  font-weight: 600;
}
.faq-answer {
  margin: 0 0 0.5rem;
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.5;
}
.faq-category {
  display: inline-block;
  background: #f1f0ed;
  color: #7d766c;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.6rem;
  border-radius: 0.3rem;
}
</style>
