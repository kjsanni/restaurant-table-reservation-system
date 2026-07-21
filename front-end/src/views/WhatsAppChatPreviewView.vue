<script setup lang="ts">
import { ref, computed } from "vue";

interface ChatMessage {
  from: "customer" | "bot";
  text: string;
  timestamp?: string;
  type?: "text" | "location" | "payment" | "tracking";
}

type FlowName = "welcome" | "reservation" | "delivery" | "tracking";

const activeFlow = ref<FlowName>("welcome");

const flows: Record<FlowName, { label: string; messages: ChatMessage[] }> = {
  welcome: {
    label: "Welcome / Opt-In",
    messages: [
      { from: "customer", text: "Hi", timestamp: "2:30 PM" },
      {
        from: "bot",
        text: "Welcome to Vibespot Restaurant!\n\nWhat would you like to do?\n1. Make a reservation\n2. Order delivery\n3. Check order status\n4. Talk to someone",
        timestamp: "2:30 PM",
      },
    ],
  },
  reservation: {
    label: "Reservation",
    messages: [
      { from: "customer", text: "1", timestamp: "2:31 PM" },
      {
        from: "bot",
        text: "Great! Let's book a table.\nWhat date? (e.g. 2026-07-22 or 'tomorrow')",
        timestamp: "2:31 PM",
      },
      { from: "customer", text: "tomorrow", timestamp: "2:31 PM" },
      {
        from: "bot",
        text: "What time? (e.g. 7:00 PM)",
        timestamp: "2:31 PM",
      },
      { from: "customer", text: "7pm", timestamp: "2:32 PM" },
      {
        from: "bot",
        text: "How many people?",
        timestamp: "2:32 PM",
      },
      { from: "customer", text: "4", timestamp: "2:32 PM" },
      {
        from: "bot",
        text: "Any special requests or notes? (Type 'skip' if none)",
        timestamp: "2:32 PM",
      },
      { from: "customer", text: "window seat please", timestamp: "2:33 PM" },
      {
        from: "bot",
        text: "Here's your reservation summary:\n📅 2026-07-22 at 7:00 PM\n👥 4 people\n📝 Window seat please\nConfirm? (yes/no)",
        timestamp: "2:33 PM",
      },
      { from: "customer", text: "yes", timestamp: "2:33 PM" },
      {
        from: "bot",
        text: "✅ Confirmed! Reservation #42.\nSee you tomorrow at 7:00 PM.",
        timestamp: "2:33 PM",
      },
    ],
  },
  delivery: {
    label: "Delivery + Location",
    messages: [
      { from: "customer", text: "2", timestamp: "3:00 PM" },
      {
        from: "bot",
        text: "Great! Let's set up your delivery.\nBrowse our menu:\n1. Mains\n2. Sides\n3. Drinks\n\nReply with the number to browse items.",
        timestamp: "3:00 PM",
      },
      { from: "customer", text: "1", timestamp: "3:01 PM" },
      {
        from: "bot",
        text: "Mains:\n1. Jollof Rice — GHS 60.00\n2. Grilled Chicken — GHS 80.00\n3. Banku & Tilapia — GHS 90.00\n\nReply with the number to add to cart.",
        timestamp: "3:01 PM",
      },
      { from: "customer", text: "1", timestamp: "3:01 PM" },
      {
        from: "bot",
        text: "Added Jollof Rice to cart.\n\nYour cart:\n• Jollof Rice x1 = GHS 60.00\nTotal: GHS 60.00\n\nReply 'checkout' to place order.",
        timestamp: "3:01 PM",
      },
      { from: "customer", text: "checkout", timestamp: "3:02 PM" },
      {
        from: "bot",
        text: "Your cart:\n• Jollof Rice x1 = GHS 60.00\nTotal: GHS 60.00\nDelivery fee: calculated after location.\n\nConfirm order? (yes/no)",
        timestamp: "3:02 PM",
      },
      { from: "customer", text: "yes", timestamp: "3:02 PM" },
      {
        from: "bot",
        text: "Where should we deliver?\n📍 Share your location (attachment → Location)\nor type your address.",
        timestamp: "3:02 PM",
      },
      {
        from: "customer",
        text: "📍 Location shared",
        timestamp: "3:03 PM",
        type: "location",
      },
      {
        from: "bot",
        text: "📍 Got your location!\nNear Methodist Church, Accra\n\nConfirm delivery address? (yes/no)",
        timestamp: "3:03 PM",
      },
      { from: "customer", text: "yes", timestamp: "3:03 PM" },
      {
        from: "bot",
        text: "Order #100 created!\nPay here: https://paystack.com/pay/abc123\n\nYou'll receive a tracking number once payment is confirmed.",
        timestamp: "3:03 PM",
        type: "payment",
      },
    ],
  },
  tracking: {
    label: "Payment & Tracking",
    messages: [
      {
        from: "bot",
        text: "🚚 Your order is on the way!\nTracking: C561819A\nDriver: Kwame\nETA: 30-45 mins",
        timestamp: "3:45 PM",
        type: "tracking",
      },
      {
        from: "bot",
        text: "✅ Delivered! Your order arrived at 3:45 PM.\nRate your experience: 1-5 ⭐",
        timestamp: "4:15 PM",
      },
    ],
  },
};

const currentMessages = computed(() => flows[activeFlow.value].messages);

const flowTabs = Object.entries(flows).map(([key, val]) => ({
  key: key as FlowName,
  label: val.label,
}));
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>WhatsApp Flow Preview</h1>
        <p>Preview how customers interact via WhatsApp</p>
      </div>
      <router-link to="/admin/settings/whatsapp-ordering" class="back-link">
        ← Back to Settings
      </router-link>
    </div>

    <div class="content-wrapper">
      <div class="preview-layout">
        <div class="flow-selector">
          <button
            v-for="tab in flowTabs"
            :key="tab.key"
            :class="['flow-tab', { active: activeFlow === tab.key }]"
            @click="activeFlow = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="phone-frame">
          <div class="phone-notch"></div>
          <div class="phone-screen">
            <div class="wa-header">
              <div class="wa-back">‹</div>
              <div class="wa-avatar">
                <span class="wa-avatar-letter">V</span>
              </div>
              <div class="wa-contact">
                <div class="wa-contact-name">Vibespot Restaurant</div>
                <div class="wa-contact-status">online</div>
              </div>
              <div class="wa-header-actions">⋮</div>
            </div>

            <div class="wa-chat-area">
              <div
                v-for="(msg, idx) in currentMessages"
                :key="idx"
                :class="[
                  'wa-message',
                  msg.from === 'customer' ? 'outgoing' : 'incoming',
                ]"
              >
                <div v-if="msg.type === 'location'" class="wa-location-bubble">
                  <div class="wa-location-icon">📍</div>
                  <div class="wa-location-text">{{ msg.text }}</div>
                </div>
                <div
                  v-else-if="msg.type === 'payment'"
                  class="wa-special-bubble"
                >
                  <div class="wa-special-icon">💳</div>
                  <pre class="wa-special-text">{{ msg.text }}</pre>
                </div>
                <div
                  v-else-if="msg.type === 'tracking'"
                  class="wa-special-bubble"
                >
                  <div class="wa-special-icon">🚚</div>
                  <pre class="wa-special-text">{{ msg.text }}</pre>
                </div>
                <pre v-else class="wa-text">{{ msg.text }}</pre>
                <div class="wa-timestamp">{{ msg.timestamp }}</div>
              </div>
            </div>

            <div class="wa-input-bar">
              <div class="wa-input-placeholder">Type a message</div>
              <div class="wa-send-btn">➤</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.flow-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.flow-tab {
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.flow-tab.active {
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  border-color: transparent;
}

.flow-tab:hover:not(.active) {
  border-color: var(--accent);
  color: var(--accent-600);
}

.phone-frame {
  width: 380px;
  max-width: 100%;
  background: #1a1a1a;
  border-radius: 36px;
  padding: 12px 8px 12px 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  position: relative;
}

.phone-notch {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 24px;
  background: #1a1a1a;
  border-radius: 0 0 16px 16px;
  z-index: 10;
}

.phone-screen {
  border-radius: 28px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 640px;
  background: #e5ddd5;
}

.wa-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #075e54;
  color: white;
  height: 56px;
  flex-shrink: 0;
}

.wa-back {
  font-size: 24px;
  color: white;
  opacity: 0.9;
}

.wa-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #128c7e;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.wa-avatar-letter {
  font-size: 18px;
  font-weight: 700;
  color: white;
}

.wa-contact {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.wa-contact-name {
  font-size: 15px;
  font-weight: 600;
}

.wa-contact-status {
  font-size: 12px;
  opacity: 0.8;
}

.wa-header-actions {
  font-size: 20px;
  opacity: 0.8;
}

.wa-chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M20 20m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0' fill='%23d4cfc7' opacity='0.3'/%3E%3C/svg%3E");
}

.wa-message {
  max-width: 75%;
  padding: 6px 10px 4px;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
  animation: wa-fade-in 0.3s ease;
}

@keyframes wa-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.wa-message.incoming {
  align-self: flex-start;
  background: white;
  border-top-left-radius: 0;
}

.wa-message.outgoing {
  align-self: flex-end;
  background: #dcf8c6;
  border-top-right-radius: 0;
}

.wa-text {
  margin: 0;
  font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  color: #303030;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.wa-timestamp {
  font-size: 10px;
  color: #999;
  text-align: right;
  margin-top: 2px;
}

.wa-location-bubble {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wa-location-icon {
  font-size: 20px;
}

.wa-location-text {
  font-size: 14px;
  color: #128c7e;
  font-weight: 600;
}

.wa-special-bubble {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.wa-special-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.wa-special-text {
  margin: 0;
  font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  color: #303030;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.wa-input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0f0f0;
  flex-shrink: 0;
}

.wa-input-placeholder {
  flex: 1;
  padding: 8px 14px;
  background: white;
  border-radius: 20px;
  font-size: 14px;
  color: #999;
}

.wa-send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #075e54;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  flex-shrink: 0;
}

.back-link {
  color: var(--accent-600);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}
</style>
