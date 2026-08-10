<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCapabilities } from "@/composables/useCapabilities";
import customerPortalAPI from "@/services/customerPortalAPI";
import { useToastStore } from "@/stores/toast";
import logger from "@/utils/logger";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { businessVertical } = useCapabilities();
const toastStore = useToastStore();
const isSalon = computed(() => businessVertical.value === "salon");

const reviews = ref<Array<{
  id: number;
  reservationId: number;
  rating: number;
  comment: string;
  channel: string;
  createdAt: string;
}>>([]);
const loading = ref(true);
const showForm = ref(false);
const selectedReservationId = ref<number | null>(null);
const rating = ref(5);
const comment = ref("");

const tenantName = computed(
  () => authStore.currentTenant?.name || (isSalon.value ? "Salon" : "Restaurant")
);

const loadReviews = async () => {
  loading.value = true;
  try {
    const res = await customerPortalAPI.getReviews();
    reviews.value = (res.data?.reviews || []) as any[];
  } catch (err) {
    logger.error("Failed to load reviews", { error: err });
    toastStore.add("Failed to load reviews", "error");
  } finally {
    loading.value = false;
  }
};

const submitReview = async () => {
  if (!selectedReservationId.value) return;
  try {
    await customerPortalAPI.createReview({
      reservationId: selectedReservationId.value,
      rating: rating.value,
      comment: comment.value || undefined,
    });
    toastStore.add("Review submitted. Thank you!", "success");
    showForm.value = false;
    selectedReservationId.value = null;
    rating.value = 5;
    comment.value = "";
    await loadReviews();
  } catch (err: any) {
    const msg = err?.response?.data?.message || "Failed to submit review";
    toastStore.add(msg, "error");
  }
};

const openReviewForm = (reservationId: number) => {
  selectedReservationId.value = reservationId;
  rating.value = 5;
  comment.value = "";
  showForm.value = true;
};

const cancelForm = () => {
  showForm.value = false;
  selectedReservationId.value = null;
  comment.value = "";
};

const stars = computed(() => {
  return Array.from({ length: 5 }, (_, i) => i + 1);
});

onMounted(() => {
  const reservationId = route.query.reservationId;
  if (reservationId) {
    selectedReservationId.value = Number(reservationId);
    showForm.value = true;
  }
  loadReviews();
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>My Reviews</h1>
        <p>Share your experience at {{ tenantName }}</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="state">Loading…</div>
      <div v-else-if="!reviews.length" class="state">
        You haven't submitted any reviews yet.
        <br />
        <button class="link-btn" @click="showForm = true">
          Write your first review
        </button>
      </div>
      <template v-else>
        <div class="reviews-list">
          <div v-for="review in reviews" :key="review.id" class="review-card">
            <div class="review-header">
              <div class="stars">
                <span
                  v-for="star in stars"
                  :key="star"
                  :class="['star', { filled: star <= review.rating }]"
                >
                  ★
                </span>
              </div>
              <span class="review-date">
                {{ new Date(review.createdAt).toLocaleDateString() }}
              </span>
            </div>
            <p v-if="review.comment" class="review-comment">
              {{ review.comment }}
            </p>
            <span v-if="review.channel" class="review-channel">
              via {{ review.channel }}
            </span>
          </div>
        </div>
      </template>

      <div v-if="showForm" class="review-form-card">
        <h3>Write a Review</h3>
        <div class="form-group">
          <label>Rating</label>
          <div class="star-input">
            <button
              v-for="star in stars"
              :key="star"
              :class="['star-btn', { filled: star <= rating }]"
              @click="rating = star"
              type="button"
            >
              ★
            </button>
          </div>
        </div>
        <div class="form-group">
          <label for="comment">Comment (optional)</label>
          <textarea
            id="comment"
            v-model="comment"
            rows="3"
            placeholder="Tell us about your experience..."
          />
        </div>
        <div class="form-actions">
          <button class="btn-secondary" @click="cancelForm">Cancel</button>
          <button class="btn-primary" @click="submitReview">Submit Review</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background-warm);
  display: flex;
  flex-direction: column;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.topbar-left h1 {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--neutral-900);
}
.topbar-left p {
  color: var(--neutral-600);
  font-size: 14px;
  margin-top: 4px;
}
.content-wrapper {
  flex: 1;
  margin: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}
.state {
  text-align: center;
  padding: var(--space-8);
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}
.link-btn {
  background: none;
  border: none;
  color: var(--brand-600);
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  margin-top: 8px;
}
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.review-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 18px;
  box-shadow: 0 4px 12px rgba(26, 20, 16, 0.04);
}
.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.stars {
  display: flex;
  gap: 4px;
}
.star {
  font-size: 20px;
  color: var(--neutral-300);
}
.star.filled {
  color: var(--accent-500);
}
.review-date {
  font-size: 12px;
  color: var(--neutral-500);
}
.review-comment {
  margin: 8px 0;
  color: var(--neutral-800);
  font-size: 14px;
  line-height: 1.5;
}
.review-channel {
  font-size: 11px;
  color: var(--neutral-500);
  text-transform: capitalize;
}
.review-form-card {
  margin-top: 24px;
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 22px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}
.review-form-card h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--neutral-900);
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-700);
  margin-bottom: 6px;
}
.star-input {
  display: flex;
  gap: 6px;
}
.star-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: var(--neutral-300);
  cursor: pointer;
  transition: color 0.15s ease;
}
.star-btn.filled {
  color: var(--accent-500);
}
textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-300);
  font-family: var(--font-sans);
  font-size: 14px;
  resize: vertical;
}
.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.btn-primary {
  padding: 8px 18px;
  border-radius: var(--radius-md);
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary {
  padding: 8px 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-300);
  background: var(--white);
  color: var(--neutral-700);
  font-weight: 600;
  cursor: pointer;
}
</style>
