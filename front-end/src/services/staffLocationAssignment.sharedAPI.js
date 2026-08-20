import { createSalonCrudAPI } from "@/composables/useSalonCrudAPI";

export default createSalonCrudAPI({
  basePath: "/staff-location-assignments",
  methods: {
    list: "/staff-location-assignments",
    get: (id) => `/staff-location-assignments/${id}`,
    create: "/staff-location-assignments",
    update: (id) => `/staff-location-assignments/${id}`,
    delete: (id) => `/staff-location-assignments/${id}`,
  },
});
