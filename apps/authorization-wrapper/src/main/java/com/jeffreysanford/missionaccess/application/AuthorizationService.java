package com.jeffreysanford.missionaccess.application;

import com.jeffreysanford.missionaccess.domain.AuthorizationDecision;
import com.jeffreysanford.missionaccess.domain.AuthorizationPort;
import com.jeffreysanford.missionaccess.infrastructure.persistence.AuthorizationAuditEvent;
import com.jeffreysanford.missionaccess.infrastructure.persistence.AuthorizationAuditRepository;
import com.jeffreysanford.missionaccess.operations.OperationsTelemetryService;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthorizationService {
    private final AuthorizationPort authorizationPort; private final AuthorizationAuditRepository auditRepository; private final OperationsTelemetryService telemetry;
    public AuthorizationService(AuthorizationPort authorizationPort, AuthorizationAuditRepository auditRepository, OperationsTelemetryService telemetry) { this.authorizationPort = authorizationPort; this.auditRepository = auditRepository; this.telemetry = telemetry; }
    @Transactional public AuthorizationDecision check(String user, String relation, String object) {
        AuthorizationDecision decision = authorizationPort.check(user, relation, object);
        auditRepository.save(new AuthorizationAuditEvent(UUID.randomUUID(), Instant.now(), user, relation, object, decision.allowed(), decision.latencyMs(), decision.explanation()));
        telemetry.recordDecision(user, relation, object, decision);
        return decision;
    }
}
