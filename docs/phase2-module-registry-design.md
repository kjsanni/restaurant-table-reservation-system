# Phase 2 Module Registry Design

## Current State

- **tenant-platform**: 60+ route files under `back-end/src/tenant-platform/routes/`
- **salon**: 17 route files under `back-end/src/verticals/salon/routes/`
- **restaurant**: 20+ route files under `back-end/src/verticals/restaurant/routes/`
- **erpnext**: 6 proxy routes under `back-end/src/integrations/erpnext/proxies/`
- All routes are hardcoded in `server.js`
- No plug-in discovery/activation system

## Proposed Module Registry

### Module Manifest Contract

```js
{
  id: string;                    // unique module id, e.g. "salon", "tenant-platform"
  name: string;                  // human-readable name
  version: string;               // semver
  enabled: () => boolean;        // runtime check (feature flags, tenant type)
  routes: Array<{
    path: string;
    router: express.Router;
    middleware?: Array<Function>;
    meta?: Record<string, any>;
  }>;
}
```

### Registry API

```js
const registry = new ModuleRegistry();

// Register a module
registry.register(salonModule);

// Load enabled modules and mount routes
registry.load(app);
```

### Implementation Plan

1. Create `back-end/src/tenant-platform/modules/module.registry.js`
2. Define module manifests for salon, tenant-platform, erpnext
3. Refactor `server.js` to use registry instead of hardcoded requires
4. Keep all existing middleware patterns intact
