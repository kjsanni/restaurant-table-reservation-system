import { createSalonCrudAPI } from "@/composables/useSalonCrudAPI";

export default createSalonCrudAPI({
  basePath: "/salon/cross-location-dashboard",
  methods: {
    list: "/salon/cross-location-dashboard",
  },
});
