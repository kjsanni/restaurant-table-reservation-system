<script setup lang="ts">
import { ref, onMounted } from "vue";
import reviewAPI from "@/services/reviewAPI";
import logger from "@/utils/logger";
import { useCurrency } from "@/composables/useCurrency";

interface Review {
  id: number;
  rating: number;
  comment?: string;
  channel?: string;
  response?: string;
  respondedAt?: string;
  flagged?: boolean;
  flagReason?: string;
  customer?: { firstName?: string; lastName?: string; email?: string };
  createdAt: string;
}

const { format: fmt } = useCurrency();

const reviews = ref<Review[]>([]);
const loading = ref(true);
const average = ref({ average: 0, count: 0 });
const responding = ref(false);
const responseText = ref<Record<number, string>>({});

const loadReviews = async () => {
  loading.value = true;
  try {
    const [reviewsRes, avgRes] = await Promise.all([
      reviewAPI.getReviews({ limit: 100 }),
      reviewAPI.getAverageRating(),
    ]);
    reviews.value = (reviewsRes.data?.collection ||
      reviewsRes.data ||
      []) as Review[];
    if (avgRes.data) {
      average.value = {
        average: avgRes.data.average || 0,
        count: avgRes.data.count || 0,
      };
    }
  } catch (err) {
    logger.error("Failed to load reviews", { error: err });
  } finally {
    loading.value = false;
  }
};

const submitResponse = async (id: number) => {
  const text = responseText.value[id];
  if (!text) return;
  responding.value = true;
  try {
    const res = await reviewAPI.respondToReview(id, text);
    const idx = reviews.value.findIndex((r) => r.id === id);
    if (idx !== -1 && res.data?.review) {
      reviews.value[idx] = res.data.review as Review;
    }
    delete responseText.value[id];
  } catch (err) {
    logger.error("Failed to respond to review", { error: err });
  } finally {
    responding.value = false;
  }
};

const deleteReview = async (id: number) => {
  if (!confirm("Delete this review?")) return;
  try {
    await reviewAPI.deleteReview(id);
    reviews.value = reviews.value.filter((r) => r.id !== id);
  } catch (err) {
    logger.error("Failed to delete review", { error: err });
  }
};

const flagReview = async (id: number) => {
  const reason = prompt("Flag reason (optional):");
  if (reason === null) return;
  try {
    const res = await reviewAPI.flagReview(id, reason || undefined);
    const idx = reviews.value.findIndex((r) => r.id === id);
    if (idx !== -1 && res.data?.review) {
      reviews.value[idx] = res.data.review as Review;
    }
  } catch (err) {
    logger.error("Failed to flag review", { error: err });
  }
};

const unflagReview = async (id: number) => {
  try {
    const res = await reviewAPI.unflagReview(id);
    const idx = reviews.value.findIndex((r) => r.id === id);
    if (idx !== -1 && res.data?.review) {
      reviews.value[idx] = res.data.review as Review;
    }
  } catch (err) {
    logger.error("Failed to unflag review", { error: err });
  }
};

const stars = (rating: number) =>
  Array.from({ length: 5 }, (_, i) => i < rating);

const formatDate = (v?: string) => {
  if (!v) return "—";
  const dt = new Date(v);
  if (isNaN(dt.getTime())) return v;
  return dt.toLocaleString();
};

onMounted(() => {
  loadReviews();
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Reviews</h1>
        <p>Customer feedback and responses</p>
      </div>
      <div class="topbar-right">
        <div class="average-badge">
          <span class="average-value">{{ average.average.toFixed(1) }}</span>
          <span class="average-count">({{ average.count }})</span>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="state">Loading…</div>

      <div v-else-if="!reviews.length" class="state">
        No reviews yet. Reviews appear after customers complete reservations.
      </div>

      <template v-else>
        <div class="reviews-list">
          <div v-for="review in reviews" :key="review.id" class="review-card">
            <div class="review-header">
              <div class="review-author">
                <b>
                  {{
                    review.customer?.firstName && review.customer?.lastName
                      ? `${review.customer.firstName} ${review.customer.lastName}`
                      : review.customer?.email || "Customer"
                  }}
                </b>
                <span class="review-date">{{
                  formatDate(review.createdAt)
                }}</span>
              </div>
              <div class="review-rating">
                <span
                  v-for="filled in stars(review.rating)"
                  :key="'filled-' + review.id + filled"
                  class="star star--filled"
                  >★</span
                >
                <span
                  v-for="empty in 5 - review.rating"
                  :key="'empty-' + review.id + empty"
                  class="star star--empty"
                  >★</span
                >
              </div>
            </div>

            <div v-if="review.comment" class="review-comment">
              {{ review.comment }}
            </div>

            <div v-if="review.channel" class="review-meta">
              Via {{ review.channel }}
            </div>

            <div v-if="review.response" class="review-response">
              <b>Your response:</b> {{ review.response }}
              <span v-if="review.respondedAt" class="response-date">
                ({{ formatDate(review.respondedAt) }})
              </span>
            </div>

            <div v-else class="review-actions">
              <input
                v-model="responseText[review.id]"
                placeholder="Write a response..."
                class="response-input"
              />
              <button
                class="btn-primary"
                :disabled="!responseText[review.id] || responding"
                @click="submitResponse(review.id)"
              >
                Respond
              </button>
            </div>

            <div class="review-footer">
              <button v-if="!review.flagged" class="btn-link btn-warn" @click="flagReview(review.id)">
                Flag
              </button>
              <button v-else class="btn-link btn-warn" @click="unflagReview(review.id)">
                Unflag
              </button>
              <button class="btn-link" @click="deleteReview(review.id)">
                Delete
              </button>
            </div>
          </div>
        </div>
      </template>
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

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.average-badge {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
}

.average-value {
  font-size: 20px;
  font-weight: 800;
}

.average-count {
  font-size: 12px;
  opacity: 0.85;
}

.content-wrapper {
  flex: 1;
  margin: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}

.state {
  padding: 18px;
  border-radius: var(--radius-xl);
  border: 1px dashed var(--neutral-300);
  color: var(--neutral-600);
  text-align: center;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.review-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.review-author {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.review-author b {
  color: var(--neutral-900);
  font-size: 15px;
}

.review-date {
  font-size: 12px;
  color: var(--neutral-500);
}

.review-rating {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 18px;
}

.star--filled {
  color: #f59e0b;
}

.star--empty {
  color: var(--neutral-300);
}

.review-comment {
  color: var(--neutral-800);
  font-size: 14px;
  line-height: 1.5;
}

.review-meta {
  font-size: 12px;
  color: var(--neutral-500);
}

.review-response {
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  background: #f0f9ff;
  color: #0369a1;
  font-size: 14px;
}

.response-date {
  display: block;
  font-size: 12px;
  color: var(--neutral-500);
  margin-top: 4px;
}

.review-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.response-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-lg);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 14px;
}

.response-input:focus {
  outline: none;
  border-color: var(--brand-600);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.btn-primary {
  padding: 10px 18px;
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.review-footer {
  display: flex;
  justify-content: flex-end;
}

.btn-link {
  background: none;
  border: none;
  color: #dc2626;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: var(--radius-lg);
}

.btn-link:hover {
  background: #fef2f2;
}

.btn-warn {
  color: #b45309;
}

.btn-warn:hover {
  background: #fffbeb;
}
</style>
