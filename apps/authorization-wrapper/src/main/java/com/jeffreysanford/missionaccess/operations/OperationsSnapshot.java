package com.jeffreysanford.missionaccess.operations;
import java.time.Instant;
import java.util.List;
public record OperationsSnapshot(Instant capturedAt, int requestsPerMinute, double availabilityPercent, long p95LatencyMs, String authorizationModelId, long totalChecks, long allowedChecks, long deniedChecks, List<MetricPoint> requestSeries, List<OperationLatency> latencyByOperation, List<ServiceNode> services, List<ServiceLink> links, List<AuditEvent> auditEvents) {
  public record MetricPoint(Instant timestamp, long value) {} public record OperationLatency(String operation, long p95Ms, long count) {}
  public record ServiceNode(String id,String label,String kind,String state,long latencyMs,int x,int y) {} public record ServiceLink(String source,String target,String label,long volume) {}
  public record AuditEvent(String id,Instant occurredAt,String actor,String action,String resource,String decision,String detail) {}
}
