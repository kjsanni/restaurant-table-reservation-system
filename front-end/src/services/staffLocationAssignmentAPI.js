import { createSalonCrudAPI } from "@/composables/useSalonCrudAPI";

export default createSalonCrudAPI({
  basePath: "/salon/staff-location-assignments",
  methods: {
    list: "/salon/staff-location-assignments",
    get: (id) => `/salon/staff-location-assignments/${id}`,
    create: "/salon/staff-location-assignments",
    update: (id) => `/salon/staff-location-assignments/${id}`,
    delete: (id) => `/salon/staff-location-assignments/${id}`,
  },
});
