import API from "@/services/API";

type HttpMethod = "get" | "post" | "patch" | "delete";

interface ExtraMethod {
  method: HttpMethod;
  path: string;
}

export function createSalonCrudAPI<
  T = any,
  E extends Record<string, ExtraMethod> = {},
>(config: {
  basePath: string;
  methods?: {
    list?: string;
    get?: string;
    create?: string;
    update?: string;
    delete?: string;
    extra?: E;
  };
}) {
  const { basePath, methods = {}, extra = {} } = config;

  const applyOverride = <K extends keyof typeof methods>(
    key: K,
    mapper: (value: string) => (...args: any[]) => any
  ) => {
    if (methods[key]) {
      return mapper(methods[key] as string);
    }
    return null;
  };

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

  const listOverride = applyOverride(
    "list",
    (path) =>
      (params = {}) =>
        API.get(path, { params })
  );
  if (listOverride) service.list = listOverride;

  const getOverride = applyOverride(
    "get",
    (path) => (id: number | string) => API.get(path(id))
  );
  if (getOverride) service.get = getOverride;

  const createOverride = applyOverride(
    "create",
    (path) => (payload: T) => API.post(path, payload)
  );
  if (createOverride) service.create = createOverride;

  const updateOverride = applyOverride(
    "update",
    (path) => (id: number | string, payload: Partial<T>) =>
      API.patch(path(id), payload)
  );
  if (updateOverride) service.update = updateOverride;

  const deleteOverride = applyOverride(
    "delete",
    (path) => (id: number | string) => API.delete(path(id))
  );
  if (deleteOverride) service.delete = deleteOverride;

  for (const [name, { method, path }] of Object.entries(extra)) {
    service[name] = (...args: any[]) => {
      const url = path.replace(/:id/g, String(args[0]));
      return API[method](url, args[1]);
    };
  }

  return service as typeof service & {
    [K in keyof E]: (...args: any[]) => any;
  };
}
