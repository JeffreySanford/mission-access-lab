import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, interval, map, Observable, of, startWith, switchMap } from 'rxjs';
import type { OperationsSnapshot } from './operations.models';

@Injectable({ providedIn: 'root' })
export class OperationsApiService {
  constructor(private readonly http: HttpClient) {}

  watchSnapshot(): Observable<OperationsSnapshot> {
    return interval(3000).pipe(
      startWith(0),
      switchMap(() => this.http.get<OperationsSnapshot>('/api/operations/snapshot').pipe(
        catchError(() => of(this.createDemoSnapshot()))
      ))
    );
  }

  private createDemoSnapshot(): OperationsSnapshot {
    const now = Date.now();
    const wave = Math.round(84 + Math.sin(now / 8500) * 18);
    const requestSeries = Array.from({ length: 24 }, (_, index) => ({
      timestamp: new Date(now - (23 - index) * 60_000).toISOString(),
      value: Math.max(18, wave + Math.round(Math.sin(index / 2.1) * 22 + index * 1.6)),
    }));
    const denied = 37 + Math.round(Math.abs(Math.sin(now / 10000)) * 9);
    const allowed = 1224 + Math.round(Math.abs(Math.cos(now / 12000)) * 120);
    return {
      capturedAt: new Date(now).toISOString(), requestsPerMinute: requestSeries.at(-1)?.value ?? 0,
      availabilityPercent: 99.96, p95LatencyMs: 43, authorizationModelId: '01J-MISSION-DEMO-03',
      totalChecks: allowed + denied, allowedChecks: allowed, deniedChecks: denied, requestSeries,
      latencyByOperation: [
        { operation: 'Check', p95Ms: 31, count: 916 }, { operation: 'ListObjects', p95Ms: 68, count: 241 },
        { operation: 'WriteTuples', p95Ms: 46, count: 58 }, { operation: 'ModelPublish', p95Ms: 119, count: 3 },
      ],
      services: [
        { id: 'portal', label: 'Angular Portal', kind: 'UI', state: 'healthy', latencyMs: 8, x: 9, y: 45 },
        { id: 'wrapper', label: 'Spring Wrapper', kind: 'API', state: 'healthy', latencyMs: 18, x: 34, y: 45 },
        { id: 'openfga', label: 'OpenFGA', kind: 'AUTHZ', state: 'healthy', latencyMs: 31, x: 64, y: 24 },
        { id: 'postgres', label: 'PostgreSQL', kind: 'DATA', state: 'healthy', latencyMs: 12, x: 64, y: 68 },
        { id: 'keycloak', label: 'Keycloak', kind: 'IDENTITY', state: 'degraded', latencyMs: 74, x: 90, y: 45 },
      ],
      links: [
        { source: 'portal', target: 'wrapper', label: 'REST / JWT', volume: 118 },
        { source: 'wrapper', target: 'openfga', label: 'Check', volume: 92 },
        { source: 'wrapper', target: 'postgres', label: 'Audit', volume: 64 },
        { source: 'wrapper', target: 'keycloak', label: 'OIDC', volume: 27 },
      ],
      auditEvents: [
        { id: '1', occurredAt: new Date(now - 12000).toISOString(), actor: 'user:alice', action: 'can_edit', resource: 'document:launch-plan', decision: 'ALLOW', detail: 'Inherited through project owner' },
        { id: '2', occurredAt: new Date(now - 33000).toISOString(), actor: 'user:mallory', action: 'can_manage', resource: 'project:orion', decision: 'DENY', detail: 'No qualifying relationship' },
        { id: '3', occurredAt: new Date(now - 58000).toISOString(), actor: 'system:model-publisher', action: 'publish', resource: 'authorization-model:03', decision: 'INFO', detail: 'Model tests passed; pinned model advanced' },
        { id: '4', occurredAt: new Date(now - 76000).toISOString(), actor: 'user:bob', action: 'can_view', resource: 'document:briefing', decision: 'ALLOW', detail: 'Team membership userset' },
      ],
    };
  }
}
