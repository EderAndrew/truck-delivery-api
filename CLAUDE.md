# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev       # Watch mode (primary dev command)
npm run start:debug     # Watch mode with debugger

# Build & Production
npm run build           # Compile TypeScript to dist/
npm run start:prod      # Run compiled build

# Lint & Format
npm run lint            # ESLint with --fix
npm run format          # Prettier on all .ts files

# Tests
npm run test                                        # All unit tests
npm run test -- src/trips/trips.service.spec.ts    # Single test file
npm run test -- --testNamePattern="should return"  # Single test by name
npm run test:cov                                    # With coverage
npm run test:e2e                                    # E2E tests
```

Server runs on port **4001**. Database: PostgreSQL (`truck_maps`) with PostGIS extension.

## Architecture

NestJS monolith with modular domain-driven structure. Every entity is scoped to a `tenant_id` — multi-tenancy is enforced at the service layer (not database-level RLS).

### Module Graph

```
AppModule
├── AuthModule          → JWT/Passport, global JwtAuthGuard + RolesGuard
├── TenantsModule       → Root aggregate; all other entities FK to tenants
├── UsersModule         → Depends on TenantsModule
├── TrucksModule        → Depends on TenantsModule
├── JobsModule          → Delivery orders; depends on TenantsModule
├── TripsModule         → Trip execution; depends on Jobs, Trucks, Users, Tracking
├── TrackingModule      → Socket.IO WebSocket gateway for real-time GPS
├── GeocodingModule     → OpenCage API integration
├── GraphHopperModule   → GraphHopper routing API (route, distance_m, duration_s)
└── EmailModule         → Nodemailer (Mailtrap in dev)
```

### Request Lifecycle

```
HTTP Request → JwtAuthGuard (global) → RolesGuard (global) → Controller → Service → TypeORM Repository → PostgreSQL
                                                                                ↓
                                                                    TrackingGateway (Socket.IO broadcast)
```

### Key Patterns

**Authentication & Authorization**
- Global `JwtAuthGuard` on all routes by default. Use `@Public()` decorator to exempt a route.
- `@Roles(Role.ADMIN)` restricts by role. Roles: `MASTER`, `ADMIN`, `USER`, `DRIVER`.
- `@GetUser('tenant_id')` extracts fields from the JWT payload in controller params.

**Multi-Tenancy**
- Every service method accepts `tenantId` (extracted from JWT) and filters all queries by it.
- Never query across tenants. Cross-tenant data access is prevented at service level.

**Geospatial (PostGIS)**
- Geometry columns use SRID 4326 (WGS84). Type `Point` for locations, `LineString` for routes.
- Input uses `GeoPointDto` (`{ longitude, latitude }`); stored internally as GeoJSON `{ type: 'Point', coordinates: [lon, lat] }`.
- Spatial indexes on `delivery_point`, `current_location`, and `route` columns.

**GraphHopper**
- `GraphHopperService.getRoute(origin, destination, profile)` returns `{ route: LineString, distance_m, duration_s }`
- Called automatically on `POST /trips/create` using `job.origin_point`, `job.delivery_point`, and `truck.gh_profile`
- `estimated_arrival` is computed as `now + duration_s`. If GH is unavailable the trip is still created without route data.
- Env vars: `GRAPHHOPPER_BASE_URL`, `GRAPHHOPPER_API_KEY`
- Uses `URLSearchParams` for serialization — GH requires repeated `point=lat,lon` params that axios default array serialization breaks.

**WebSocket Tracking**
- `TrackingGateway` uses Socket.IO rooms keyed by `public_tracking_token`.
- Trips have a `public_tracking_token` (UUID) enabling unauthenticated tracking via `GET /trips/track/:token`.

**DTO Validation**
- Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- Use `class-validator` decorators on all DTOs. Nested objects require `@ValidateNested()` + `@Type()`.

**Password Security**
- `User.password_hash` has `select: false` — never returned in queries unless explicitly selected.

### Entity Cascade Rules
- Deleting a `Tenant` cascades to all its `Users`, `Trucks`, and `Jobs`.
- `Trip` FK references (`job_id`, `truck_id`, `driver_id`) use `RESTRICT` — cannot delete referenced entities while trips exist.

### Environment Variables (`.env`)
Key vars: `DB_*` (postgres connection), `JWT_SECRET`, `JWT_TTL` (900s), `JWT_REFRESH_TTL` (86400s), `PORT` (4001), `FRONTEND_URL`, `OPENCAGE_API_KEY`.

`DB_SYNCHRONIZE=1` in dev — TypeORM auto-syncs schema. Do not use in production.
