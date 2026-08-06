import API from "@/services/API";

export function createSalonCrudAPI<T = any>(config: {
  basePath: string;
  methods?: {
    list?: string;
    get?: string;
    create?: string;
    update?: string;
    delete?: string;
    extra?: Record<
      string,
      { method: "get" | "post" | "patch" | "delete"; path: string }
    >;
  };
}) {
  const { basePath, methods = {}, extra = {} } = config;

  const service = {
    list(params = {}) {
      return API.get(basePath, { params });
    },
    get(id: number | string) {
      return API.get(`${basePath}/${id}`);
    },
    create(payload: T) {
      return API.post(basePath, payload);
    },
    update(id: number | string, payload: Partial<T>) {
      return API.patch(`${basePath}/${id}`, payload);
    },
    delete(id: number | string) {
      return API.delete(`${basePath}/${id}`);
    },
  };

  if (methods.list)
    service.list = (params = {}) => API.get(methods.list, { params });
  if (methods.get)
    service.get = (id: number | string) => API.get(methods.get(id));
  if (methods.create)
    service.create = (payload: T) => API.post(methods.create, payload);
  if (methods.update)
    service.update = (id: number | string, payload: Partial<T>) =>
      API.patch(methods.update(id), payload);
  if (methods.delete)
    service.delete = (id: number | string) => API.delete(methods.delete(id));

  for (const [name, { method, path }] of Object.entries(extra)) {
    service[name] = (...args: any[]) => {
      const url = path.replace(/:id/g, String(args[0]));
      return API[method](url, args[1]);
    };
  }

  return service;
}
