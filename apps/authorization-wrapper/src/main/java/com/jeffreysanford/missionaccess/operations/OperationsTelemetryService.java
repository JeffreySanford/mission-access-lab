package com.jeffreysanford.missionaccess.operations;

import com.jeffreysanford.missionaccess.config.OpenFgaProperties;
import com.jeffreysanford.missionaccess.domain.AuthorizationDecision;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class OperationsTelemetryService {
  private final AtomicLong total=new AtomicLong(1280), allowed=new AtomicLong(1235), denied=new AtomicLong(45); private final ArrayDeque<OperationsSnapshot.AuditEvent> events=new ArrayDeque<>();
  private final Counter checkCounter; private final Timer decisionTimer; private final OpenFgaProperties properties;
  public OperationsTelemetryService(MeterRegistry registry, OpenFgaProperties properties){this.properties=properties;checkCounter=registry.counter("mission.authorization.checks");decisionTimer=registry.timer("mission.authorization.decision"); seed();}
  public synchronized void recordDecision(String actor,String action,String resource,AuthorizationDecision decision){total.incrementAndGet();(decision.allowed()?allowed:denied).incrementAndGet();checkCounter.increment();decisionTimer.record(decision.latencyMs(), TimeUnit.MILLISECONDS);events.addFirst(new OperationsSnapshot.AuditEvent(decision.decisionId(),Instant.now(),actor,action,resource,decision.allowed()?"ALLOW":"DENY",decision.explanation()));while(events.size()>8)events.removeLast();}
  public synchronized OperationsSnapshot snapshot(){Instant now=Instant.now();List<OperationsSnapshot.MetricPoint> series=new ArrayList<>();for(int i=23;i>=0;i--){long v=78+Math.round(Math.sin((23-i)/2.2)*17)+(23-i)*2;series.add(new OperationsSnapshot.MetricPoint(now.minus(Duration.ofMinutes(i)),v));}long p95=Math.max(22,Math.round(decisionTimer.max(TimeUnit.MILLISECONDS)));return new OperationsSnapshot(now,(int)series.getLast().value(),99.96,p95,properties.modelId()==null||properties.modelId().isBlank()?"DEMO-MODEL-NOT-PINNED":properties.modelId(),total.get(),allowed.get(),denied.get(),series,List.of(new OperationsSnapshot.OperationLatency("Check",Math.max(31,p95),total.get()),new OperationsSnapshot.OperationLatency("ListObjects",68,241),new OperationsSnapshot.OperationLatency("WriteTuples",46,58),new OperationsSnapshot.OperationLatency("ModelPublish",119,3)),List.of(new OperationsSnapshot.ServiceNode("portal","Angular Portal","UI","healthy",8,9,45),new OperationsSnapshot.ServiceNode("wrapper","Spring Wrapper","API","healthy",18,34,45),new OperationsSnapshot.ServiceNode("openfga","OpenFGA","AUTHZ","healthy",31,64,24),new OperationsSnapshot.ServiceNode("postgres","PostgreSQL","DATA","healthy",12,64,68),new OperationsSnapshot.ServiceNode("keycloak","Keycloak","IDENTITY","degraded",74,90,45)),List.of(new OperationsSnapshot.ServiceLink("portal","wrapper","REST / JWT",118),new OperationsSnapshot.ServiceLink("wrapper","openfga","Check",92),new OperationsSnapshot.ServiceLink("wrapper","postgres","Audit",64),new OperationsSnapshot.ServiceLink("wrapper","keycloak","OIDC",27)),List.copyOf(events));}
  private void seed(){events.add(new OperationsSnapshot.AuditEvent(UUID.randomUUID().toString(),Instant.now().minusSeconds(12),"user:alice","can_edit","document:launch-plan","ALLOW","Inherited through project owner"));events.add(new OperationsSnapshot.AuditEvent(UUID.randomUUID().toString(),Instant.now().minusSeconds(33),"user:mallory","can_manage","project:orion","DENY","No qualifying relationship"));events.add(new OperationsSnapshot.AuditEvent(UUID.randomUUID().toString(),Instant.now().minusSeconds(58),"system:model-publisher","publish","authorization-model:03","INFO","Model tests passed; pinned model advanced"));}
}
