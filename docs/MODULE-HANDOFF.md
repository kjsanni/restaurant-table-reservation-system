# Module Handoff Documentation

## Module Registry
The platform uses a dynamic module loader (`loadModules`) that discovers and registers vertical modules at startup.

### Module Structure
```
back-end/src/
├── tenant-platform/
│   ├── modules/
│   │   └── tenant-platform.module.js
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   └── middleware/
├── verticals/
│   ├── restaurant/
│   │   ├── modules/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── middleware/
│   ├── salon/
│   └── event/
```

### Module Manifest
Each module exports an object with:
- `id`: Unique module identifier
- `name`: Human-readable name
- `version`: Semantic version
- `enabled`: Function returning boolean
- `manifestPath`: Path to module manifest
- `routes`: Array of route definitions with path, router, and middleware

### Route Registration
Routes are mounted via `loadModules(app)` in `src/utils/server.js`. Each route definition includes:
- `path`: Base path for the router
- `router`: Express router instance
- `middleware`: Array of middleware functions

### Middleware Stack
Standard middleware applied to all routes:
1. `resolveTenant` - Resolves tenant from subdomain/header
2. `requireActiveTenant` - Ensures tenant is active
3. `generalLimiter` - Rate limiting
4. `versioningHeaders` - API version headers
5. Vertical-specific middleware (e.g., `requireVertical("event")`)

### Adding a New Module
1. Create module directory under `back-end/src/verticals/<name>/`
2. Create `modules/<name>.module.js` with module manifest
3. Create controllers, services, routes, and middleware
4. Register module in `back-end/src/tenant-platform/modules/module.loader.js`
