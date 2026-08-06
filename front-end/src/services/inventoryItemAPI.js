import { createSalonCrudAPI } from "@/composables/useSalonCrudAPI";

export default createSalonCrudAPI({
  basePath: "/salon/inventory",
  methods: {
    list: "/salon/inventory",
    get: (id) => `/salon/inventory/${id}`,
    create: "/salon/inventory",
    update: (id) => `/salon/inventory/${id}`,
    delete: (id) => `/salon/inventory/${id}`,
  },
  extra: {
    getLowStock: { method: "get", path: "/salon/inventory/alerts/low-stock" },
  },
});
