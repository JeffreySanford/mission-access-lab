CREATE TABLE authorization_audit_event (
  id UUID PRIMARY KEY,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  actor VARCHAR(160) NOT NULL,
  relation_name VARCHAR(120) NOT NULL,
  resource_name VARCHAR(240) NOT NULL,
  allowed BOOLEAN NOT NULL,
  latency_ms BIGINT NOT NULL,
  explanation VARCHAR(500) NOT NULL
);
CREATE INDEX idx_audit_event_occurred_at ON authorization_audit_event (occurred_at DESC);
