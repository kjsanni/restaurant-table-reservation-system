<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import menuAPI from "@/services/menuAPI";
import { useCartStore } from "@/stores/cart";
import { useCurrency } from "@/composables/useCurrency";
import logger from "@/utils/logger";

const router = useRouter();
const cartStore = useCartStore();
const { format: fmt } = useCurrency();

const categories = ref<
  Array<{ id: number; name: string; description?: string }>
>([]);
const items = ref<Array<any>>([]);
const loading = ref(false);
const activeCategory = ref<number | null>(null);
const cartOpen = ref(false);

onMounted(async () => {
  cartStore.hydrate();
  await loadMenu();
});

const loadMenu = async () => {
  loading.value = true;
  try {
    const [catRes, itemRes] = await Promise.all([
      menuAPI.getCategories(),
      menuAPI.getMenuItems({ isAvailable: "true" }),
    ]);
    categories.value = catRes.data?.categories || [];
    items.value = itemRes.data?.items || [];
  } catch (err) {
    logger.error("Failed to load menu", { error: err });
  } finally {
    loading.value = false;
  }
};

const filteredItems = computed(() => {
  if (!activeCategory.value) return items.value;
  return items.value.filter((i) => i.categoryId === activeCategory.value);
});

const addToCart = (item: any) => {
  cartStore.addItem({
    menuItemId: item.id,
    name: item.name,
    price: parseFloat(item.price),
    selectedOptions: [],
    itemNotes: "",
  });
  cartOpen.value = true;
};

const goToCheckout = () => {
  if (!cartStore.count) return;
  cartStore.saveToStorage();
  router.push("/checkout");
};
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Menu</h1>
        <p>Customize your meal and place an order</p>
      </div>
      <div class="topbar-right">
        <button class="cart-badge" @click="cartOpen = !cartOpen">
          Cart ({{ cartStore.count }})
        </button>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="menu-layout">
        <aside class="menu-sidebar">
          <button
            :class="['cat-btn', { active: activeCategory === null }]"
            @click="activeCategory = null"
          >
            All
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            :class="['cat-btn', { active: activeCategory === cat.id }]"
            @click="activeCategory = cat.id"
          >
            {{ cat.name }}
          </button>
        </aside>

        <div class="menu-grid">
          <div v-if="loading" class="state">Loading menu…</div>
          <div v-else-if="!filteredItems.length" class="state">
            No items found.
          </div>
          <div v-for="item in filteredItems" :key="item.id" class="menu-card">
            <div class="menu-card-body">
              <h3>{{ item.name }}</h3>
              <p v-if="item.description">{{ item.description }}</p>
              <span class="price">{{ fmt(item.price) }}</span>
            </div>
            <button class="btn-add" @click="addToCart(item)">Add</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="cartOpen" class="cart-overlay" @click.self="cartOpen = false">
      <div class="cart-panel">
        <div class="cart-header">
          <h3>Your Cart</h3>
          <button class="cart-close" @click="cartOpen = false">×</button>
        </div>
        <div v-if="!cartStore.items.length" class="state">Cart is empty.</div>
        <div v-else class="cart-items">
          <div
            v-for="(item, idx) in cartStore.items"
            :key="idx"
            class="cart-item"
          >
            <div class="cart-item-info">
              <b>{{ item.name }}</b>
              <span>{{ fmt(item.price) }}</span>
            </div>
            <div class="cart-item-controls">
              <button
                @click="
                  cartStore.updateQuantity(
                    item.menuItemId,
                    item.quantity - 1,
                    item.itemNotes
                  )
                "
              >
                −
              </button>
              <span>{{ item.quantity }}</span>
              <button
                @click="
                  cartStore.updateQuantity(
                    item.menuItemId,
                    item.quantity + 1,
                    item.itemNotes
                  )
                "
              >
                +
              </button>
              <button
                class="cart-remove"
                @click="cartStore.removeItem(item.menuItemId, item.itemNotes)"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
        <div v-if="cartStore.items.length" class="cart-footer">
          <div class="cart-total">Total: {{ fmt(cartStore.total) }}</div>
          <button class="btn-checkout" @click="goToCheckout">Checkout</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-layout {
  display: flex;
  gap: var(--space-4);
}

.menu-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 160px;
}

.cat-btn {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all var(--duration-150) var(--ease-in-out);
}

.cat-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.menu-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-4);
}

.menu-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  box-shadow: var(--card-shadow);
}

.menu-card-body h3 {
  margin: 0 0 var(--space-1) 0;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--ink);
}

.menu-card-body p {
  margin: 0 0 var(--space-2) 0;
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
  color: var(--ink-muted);
}

.price {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--ink);
}

.btn-add {
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-lg);
  background: var(--accent);
  color: white;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-in-out);
}

.btn-add:hover {
  background: var(--accent-hover);
}

.cart-badge {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-in-out);
}

.cart-badge:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.cart-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: flex-end;
  z-index: 1000;
}

.cart-panel {
  width: min(420px, 100vw);
  height: 100%;
  background: var(--surface);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border);
}

.cart-header h3 {
  margin: 0;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--ink);
}

.cart-close {
  background: none;
  border: none;
  font-size: 22px;
  color: var(--ink-muted);
  cursor: pointer;
}

.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.cart-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.cart-item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-item-info b {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--ink);
}

.cart-item-info span {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--ink);
}

.cart-item-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.cart-item-controls button {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.cart-remove {
  margin-left: auto;
  width: auto;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--rose-600);
  border-color: var(--rose-200);
}

.cart-footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.cart-total {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-xl);
  color: var(--ink);
}

.btn-checkout {
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-in-out);
  box-shadow: var(--shadow-sm);
}

.btn-checkout:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.state {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--space-10) var(--space-5);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
}

@media (max-width: 768px) {
  .menu-layout {
    flex-direction: column;
  }

  .menu-sidebar {
    flex-direction: row;
    overflow-x: auto;
    min-width: auto;
  }
}
</style>
