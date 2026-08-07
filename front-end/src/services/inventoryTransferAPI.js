import { createSalonCrudAPI } from "@/composables/useSalonCrudAPI";

export default createSalonCrudAPI({
  basePath: "/salon/inventory-transfers",
  methods: {
    list: "/salon/inventory-transfers",
    get: (id) => `/salon/inventory-transfers/${id}`,
    create: "/salon/inventory-transfers",
    update: (id) => `/salon/inventory-transfers/${id}`,
    delete: (id) => `/salon/inventory-transfers/${id}`,
  },
  extra: {
    complete: {
      method: "patch",
      path: "/salon/inventory-transfers/:id/complete",
    },
    cancel: { method: "patch", path: "/salon/inventory-transfers/:id/cancel" },
  },
});
