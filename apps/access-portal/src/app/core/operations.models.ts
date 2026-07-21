export type HealthState = 'healthy' | 'degraded' | 'offline';
export interface MetricPoint { timestamp: string; value: number; }
export interface ServiceNode { id: string; label: string; kind: string; state: HealthState; latencyMs: number; x: number; y: number; }
export interface ServiceLink { source: string; target: string; label: string; volume: number; }
export interface AuditEvent { id: string; occurredAt: string; actor: string; action: string; resource: string; decision: 'ALLOW' | 'DENY' | 'INFO'; detail: string; }
export interface OperationsSnapshot {
  capturedAt: string;
  requestsPerMinute: number;
  availabilityPercent: number;
  p95LatencyMs: number;
  authorizationModelId: string;
  totalChecks: number;
  allowedChecks: number;
  deniedChecks: number;
  requestSeries: MetricPoint[];
  latencyByOperation: Array<{ operation: string; p95Ms: number; count: number }>;
  services: ServiceNode[];
  links: ServiceLink[];
  auditEvents: AuditEvent[];
}
export interface OperationsViewModel extends OperationsSnapshot {
  trafficPath: string;
  trafficAreaPath: string;
  allowPercent: number;
  denyPercent: number;
}
