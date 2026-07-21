package com.jeffreysanford.missionaccess.infrastructure.persistence;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface AuthorizationAuditRepository extends JpaRepository<AuthorizationAuditEvent, UUID> {}
