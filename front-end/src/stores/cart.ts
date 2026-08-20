import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  selectedOptions: Array<{ name: string; priceAdjustment: number }>;
  itemNotes: string | null;
}

export const useCartStore = defineStore("cart", () => {
  const items = ref<CartItem[]>([]);

  const total = computed(() =>
    items.value.reduce((sum, item) => {
      const optionsTotal = item.selectedOptions.reduce(
        (s, o) => s + o.priceAdjustment,
        0
      );
      return sum + (item.price + optionsTotal) * item.quantity;
    }, 0)
  );

  const count = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  );

  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    const existing = items.value.find(
      (i) => i.menuItemId === item.menuItemId && i.itemNotes === item.itemNotes
    );
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.value.push({ ...item, quantity });
    }
  };

  const removeItem = (menuItemId: number, itemNotes?: string | null) => {
    items.value = items.value.filter(
      (i) => !(i.menuItemId === menuItemId && i.itemNotes === itemNotes)
    );
  };

  const updateQuantity = (
    menuItemId: number,
    quantity: number,
    itemNotes?: string | null
  ) => {
    const item = items.value.find(
      (i) => i.menuItemId === menuItemId && i.itemNotes === itemNotes
    );
    if (item) {
      item.quantity = Math.max(1, quantity);
    }
  };

  const clear = () => {
    items.value = [];
  };

  // NOTE: Cart data is non-sensitive. It only ever stores menu item IDs
  // (menuItemId), the menu item name (not a customer name), price, quantity,
  // selected option adjustments, and free-text item notes. It must never hold
  // customer PII such as names, emails, phone numbers, or delivery addresses.
  const loadFromStorage = () => {
    try {
      const raw = localStorage.getItem("cart");
      if (raw) {
        items.value = JSON.parse(raw);
      }
    } catch {
      items.value = [];
    }
  };

  const saveToStorage = () => {
    // Persisted payload is limited to menu item IDs and quantities only; no
    // customer PII is stored in cart.
    localStorage.setItem("cart", JSON.stringify(items.value));
  };

  const hydrate = () => {
    loadFromStorage();
  };

  return {
    items,
    total,
    count,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    loadFromStorage,
    saveToStorage,
    hydrate,
  };
});
