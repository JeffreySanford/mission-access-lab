package com.jeffreysanford.missionaccess.infrastructure.persistence;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "authorization_audit_event")
public class AuthorizationAuditEvent {
    @Id private UUID id; private Instant occurredAt; private String actor; private String relationName; private String resourceName; private boolean allowed; private long latencyMs; private String explanation;
    protected AuthorizationAuditEvent() {}
    public AuthorizationAuditEvent(UUID id, Instant occurredAt, String actor, String relationName, String resourceName, boolean allowed, long latencyMs, String explanation) { this.id=id; this.occurredAt=occurredAt; this.actor=actor; this.relationName=relationName; this.resourceName=resourceName; this.allowed=allowed; this.latencyMs=latencyMs; this.explanation=explanation; }
    public UUID getId(){return id;} public Instant getOccurredAt(){return occurredAt;} public String getActor(){return actor;} public String getRelationName(){return relationName;} public String getResourceName(){return resourceName;} public boolean isAllowed(){return allowed;} public long getLatencyMs(){return latencyMs;} public String getExplanation(){return explanation;}
}
