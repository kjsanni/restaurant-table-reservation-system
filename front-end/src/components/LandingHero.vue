<script setup lang="ts">
import { ref } from "vue";

interface Props {
  hasDineIn: boolean;
  hasDelivery: boolean;
  isSalon: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "menu"): void;
  (e: "reserve"): void;
}>();

const heroGlow = ref({ x: 0, y: 0, visible: false });

const onHeroMouseMove = (e: MouseEvent) => {
  heroGlow.value = {
    x:
      e.clientX -
      (e.currentTarget as HTMLElement)?.getBoundingClientRect().left,
    y:
      e.clientY - (e.currentTarget as HTMLElement)?.getBoundingClientRect().top,
    visible: true,
  };
};

const onHeroMouseLeave = () => {
  heroGlow.value.visible = false;
};
</script>

<template>
  <section class="hero hero-spotlight">
    <div class="hero-bg">
      <div class="hero-slide">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80"
          alt="Restaurant interior"
          loading="eager"
          fetchpriority="high"
          width="1600"
          height="900"
        />
      </div>
      <div class="hero-slide">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80"
          alt="Plated dish"
          loading="eager"
          width="1600"
          height="900"
        />
      </div>
      <div class="hero-slide">
        <img
          src="https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=1600&q=80"
          alt="Restaurant bar"
          loading="eager"
          width="1600"
          height="900"
        />
      </div>
      <div class="hero-slide">
        <img
          src="https://images.unsplash.com/photo-1544148103-0773bf10d330?w=1600&q=80"
          alt="Fine dining"
          loading="eager"
          width="1600"
          height="900"
        />
      </div>
      <div class="hero-overlay"></div>
      <div class="hero-orb hero-orb-1"></div>
      <div class="hero-orb hero-orb-2"></div>
      <div class="hero-orb hero-orb-3"></div>
      <div
        class="hero-glow"
        :style="{
          background: heroGlow.visible
            ? `radial-gradient(700px circle at ${heroGlow.x}px ${heroGlow.y}px, rgba(217,119,6,0.18), transparent 40%)`
            : 'none',
        }"
        @mousemove="onHeroMouseMove"
        @mouseleave="onHeroMouseLeave"
      ></div>
    </div>
    <div class="hero-content">
      <div class="hero-badge">
        <Icon icon="mdi:whatsapp" width="16" height="16" />
        Order via WhatsApp
      </div>
      <h1 class="hero-title">
        Great food,<br />
        <span class="hero-accent">zero hassle.</span>
      </h1>
      <p class="hero-subtitle">
        Browse our menu, check free tables, and book your table in seconds.
        Takeaway, walk-in, or reservation — we've got you covered.
      </p>
      <div class="hero-actions">
        <button class="btn-primary-lg" @click="emit('menu')">
          <Icon icon="mdi:book-open-outline" width="20" height="20" />
          View Menu
        </button>
        <button
          v-if="hasDineIn"
          class="btn-secondary-lg"
          @click="emit('reserve')"
        >
          <Icon icon="mdi:calendar-check" width="20" height="20" />
          Book a Table
        </button>
        <button
          v-if="hasDelivery && !hasDineIn"
          class="btn-secondary-lg"
          @click="emit('menu')"
        >
          <Icon icon="mdi:moped" width="20" height="20" />
          Order Delivery
        </button>
      </div>
      <div class="hero-social-proof">
        <div class="hero-avatars">
          <div class="avatar avatar-1">AK</div>
          <div class="avatar avatar-2">KO</div>
          <div class="avatar avatar-3">EA</div>
        </div>
        <p class="hero-proof-text">
          <span class="proof-bold">2,400+</span> happy guests this month
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 120px 24px 80px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.hero-slide {
  position: absolute;
  inset: -40px;
  animation: heroFade 16s ease-in-out infinite;
}

.hero-slide:nth-child(1) {
  animation-delay: 0s;
}
.hero-slide:nth-child(2) {
  animation-delay: 4s;
}
.hero-slide:nth-child(3) {
  animation-delay: 8s;
}
.hero-slide:nth-child(4) {
  animation-delay: 12s;
}

.hero-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: kenBurns 20s ease-in-out infinite alternate;
  will-change: transform;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(26, 20, 16, 0.55) 0%,
    rgba(26, 20, 16, 0.35) 40%,
    rgba(26, 20, 16, 0.65) 100%
  );
  z-index: 1;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.35;
  animation: float 14s ease-in-out infinite;
}

.hero-orb-1 {
  width: 520px;
  height: 520px;
  background: var(--accent-300);
  top: -180px;
  left: -120px;
  animation-delay: 0s;
}

.hero-orb-2 {
  width: 420px;
  height: 420px;
  background: var(--earth-300);
  bottom: -120px;
  right: -100px;
  animation-delay: 5s;
}

.hero-orb-3 {
  width: 320px;
  height: 320px;
  background: var(--sky-300);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 9s;
}

.hero-glow {
  position: absolute;
  inset: 0;
  transition: background 0.12s ease;
  pointer-events: none;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-35px) scale(1.06);
  }
}

@keyframes kenBurns {
  0% {
    transform: scale(1) translate(0, 0);
  }
  100% {
    transform: scale(1.08) translate(-10px, -8px);
  }
}

@keyframes heroFade {
  0%,
  18% {
    opacity: 1;
  }
  20%,
  38% {
    opacity: 0;
  }
  40%,
  58% {
    opacity: 1;
  }
  60%,
  78% {
    opacity: 0;
  }
  80%,
  98% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.hero-content {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  z-index: 2;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 24px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.6s ease 0.2s forwards;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.hero-title {
  font-family: var(--font-serif);
  font-size: clamp(40px, 7vw, 72px);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: #ffffff;
  margin: 0 0 20px;
  opacity: 0;
  transform: translateY(30px);
  animation: fadeInUp 0.7s ease 0.35s forwards;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.35);
}

.hero-accent {
  background: linear-gradient(135deg, var(--accent-400), var(--earth-400));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: clamp(16px, 2.2vw, 20px);
  color: rgba(255, 255, 255, 0.85);
  max-width: 600px;
  margin: 0 auto 32px;
  line-height: 1.6;
  opacity: 0;
  transform: translateY(30px);
  animation: fadeInUp 0.7s ease 0.5s forwards;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.3);
}

.hero-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
  opacity: 0;
  transform: translateY(30px);
  animation: fadeInUp 0.7s ease 0.65s forwards;
}

.btn-primary-lg {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 28px;
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(217, 119, 6, 0.3);
  transition: all 0.25s ease;
}

.btn-primary-lg:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(217, 119, 6, 0.4);
}

.btn-primary-lg:active {
  transform: translateY(-1px) scale(0.98);
}

.btn-secondary-lg {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 28px;
  border: 1.5px solid var(--neutral-300);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.8);
  color: var(--neutral-800);
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.25s ease;
}

.btn-secondary-lg:hover {
  transform: translateY(-3px);
  border-color: var(--neutral-400);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  background: white;
}

.btn-secondary-lg:active {
  transform: translateY(-1px) scale(0.98);
}

.hero-social-proof {
  margin-top: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.7s ease 0.8s forwards;
}

.hero-avatars {
  display: flex;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  color: white;
  border: 2.5px solid white;
  margin-left: -12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.avatar:first-child {
  margin-left: 0;
}

.avatar:hover {
  transform: translateY(-3px) scale(1.1);
  z-index: 2;
}

.avatar-1 {
  background: linear-gradient(135deg, var(--accent-400), var(--accent-600));
}
.avatar-2 {
  background: linear-gradient(135deg, var(--earth-400), var(--earth-600));
}
.avatar-3 {
  background: linear-gradient(135deg, var(--sky-400), var(--sky-600));
}

.hero-proof-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.35);
}

.proof-bold {
  font-weight: 700;
  color: #ffffff;
}

@media (max-width: 768px) {
  .hero {
    padding: 100px 20px 60px;
    min-height: auto;
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-primary-lg,
  .btn-secondary-lg {
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-badge,
  .hero-title,
  .hero-subtitle,
  .hero-actions,
  .hero-social-proof {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .hero-orb {
    animation: none;
  }
}
</style>
