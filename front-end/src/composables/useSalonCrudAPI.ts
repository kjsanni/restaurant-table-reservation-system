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
  const basePath = config.basePath;
  const methods = config.methods || {};
  const extra = (config.methods && config.methods.extra) || ({} as E);

  const applyOverride = <K extends keyof typeof methods>(
    key: K,
    mapper: (value: string) => (...args: any[]) => any
  ) => {
    const value = methods[key];
    if (value) {
      return mapper(value as string);
    }
    return null;
  };

  const service: Record<string, (...args: any[]) => any> = {
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
    (path) => (id: number | string) => API.get(path.replace(/:id/g, String(id)))
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
      API.patch(path.replace(/:id/g, String(id)), payload)
  );
  if (updateOverride) service.update = updateOverride;

  const deleteOverride = applyOverride(
    "delete",
    (path) => (id: number | string) =>
      API.delete(path.replace(/:id/g, String(id)))
  );
  if (deleteOverride) service.delete = deleteOverride;

  const extraMethods = extra as Record<string, ExtraMethod>;
  for (const [name, def] of Object.entries(extraMethods)) {
    const method = def.method;
    const path = def.path;
    service[name] = (...args: any[]) => {
      const url = path.replace(/:id/g, String(args[0]));
      return (API as any)[method](url, args[1]);
    };
  }

  return service as typeof service & {
    [K in keyof E]: (...args: any[]) => any;
  };
}
