import { createSalonCrudAPI } from "@/composables/useSalonCrudAPI";

export default createSalonCrudAPI({
  basePath: "/salon/marketing-campaigns",
  methods: {
    list: "/salon/marketing-campaigns",
    get: (id) => `/salon/marketing-campaigns/${id}`,
    create: "/salon/marketing-campaigns",
    update: (id) => `/salon/marketing-campaigns/${id}`,
    delete: (id) => `/salon/marketing-campaigns/${id}`,
  },
  extra: {
    send: { method: "post", path: "/salon/marketing-campaigns/:id/send" },
  },
});
