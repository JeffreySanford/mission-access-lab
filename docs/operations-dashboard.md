# Operations dashboard

The `OperationsOverviewComponent` is the platform-wide visual status view requested for this lab.

## Data contract

- Backend: `OperationsController.snapshot()`
- Aggregation: `OperationsTelemetryService.snapshot()`
- Shared frontend shape: `core/operations.models.ts`
- Polling and fallback: `OperationsApiService.watchSnapshot()`

The backend records each authorization decision through `recordDecision(...)`. The dashboard endpoint converts the counters, latency timer, recent audit events, service topology, and request history into one read-optimized snapshot.

## Visualizations

1. KPI cards: request rate, availability, P95 latency, pinned model ID.
2. SVG line/area chart: recent authorization request volume.
3. SVG donut: allow-versus-deny distribution.
4. Animated topology: Angular → Spring → OpenFGA/PostgreSQL/Keycloak.
5. Horizontal performance bars: P95 latency by OpenFGA operation.
6. Live activity stream: recent allow, deny, and model-management events.

No chart library is required. SVG paths are generated in `buildTrafficPaths`, which makes the geometry easy to study. The topology uses semantic HTML nodes over an SVG connection layer.

## Animation and accessibility

SCSS keyframes animate line drawing, service flow, node float, bar growth, event entry, and health pulses. The final `prefers-reduced-motion` rules disable continuous and entrance animations for users who request reduced motion. The charts include role/aria-label descriptions and do not rely on color alone for decision text.
