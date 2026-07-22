package com.jeffreysanford.missionaccess.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.jeffreysanford.missionaccess.domain.*;
import com.jeffreysanford.missionaccess.infrastructure.persistence.AuthorizationAuditEvent;
import com.jeffreysanford.missionaccess.infrastructure.persistence.AuthorizationAuditRepository;
import com.jeffreysanford.missionaccess.operations.OperationsTelemetryService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class AuthorizationServiceTest {

  @Test
  void persistsAndRecordsTheDecision() {
    AuthorizationPort port = mock(AuthorizationPort.class);
    AuthorizationAuditRepository repo = mock(AuthorizationAuditRepository.class);
    OperationsTelemetryService telemetry = mock(OperationsTelemetryService.class);
    when(port.check("user:alice", "can_edit", "document:launch-plan"))
        .thenReturn(new AuthorizationDecision(true, "decision-1", 12, "owner"));
    AuthorizationService service = new AuthorizationService(port, repo, telemetry);

    AuthorizationDecision result = service.check("user:alice", "can_edit", "document:launch-plan");

    assertThat(result.allowed()).isTrue();
    verify(repo).save(any());
    verify(telemetry).recordDecision("user:alice", "can_edit", "document:launch-plan", result);
  }

  @Test
  void persistsTheAuditEventWithTheExactCheckedFields() {
    AuthorizationPort port = mock(AuthorizationPort.class);
    AuthorizationAuditRepository repo = mock(AuthorizationAuditRepository.class);
    OperationsTelemetryService telemetry = mock(OperationsTelemetryService.class);
    when(port.check("user:bob", "can_edit", "project:orion"))
        .thenReturn(new AuthorizationDecision(false, "decision-2", 7, "viewer only"));
    AuthorizationService service = new AuthorizationService(port, repo, telemetry);

    service.check("user:bob", "can_edit", "project:orion");

    ArgumentCaptor<AuthorizationAuditEvent> captor =
        ArgumentCaptor.forClass(AuthorizationAuditEvent.class);
    verify(repo).save(captor.capture());
    AuthorizationAuditEvent saved = captor.getValue();
    assertThat(saved.getId()).isNotNull();
    assertThat(saved.getOccurredAt()).isNotNull();
    assertThat(saved.getActor()).isEqualTo("user:bob");
    assertThat(saved.getRelationName()).isEqualTo("can_edit");
    assertThat(saved.getResourceName()).isEqualTo("project:orion");
    assertThat(saved.isAllowed()).isFalse();
    assertThat(saved.getLatencyMs()).isEqualTo(7);
    assertThat(saved.getExplanation()).isEqualTo("viewer only");
  }

  @Test
  void recordsTelemetryExactlyOnce() {
    AuthorizationPort port = mock(AuthorizationPort.class);
    AuthorizationAuditRepository repo = mock(AuthorizationAuditRepository.class);
    OperationsTelemetryService telemetry = mock(OperationsTelemetryService.class);
    when(port.check(any(), any(), any()))
        .thenReturn(new AuthorizationDecision(true, "decision-3", 1, "owner"));
    AuthorizationService service = new AuthorizationService(port, repo, telemetry);

    service.check("user:alice", "can_view", "project:orion");

    verify(telemetry, times(1)).recordDecision(any(), any(), any(), any());
  }

  @Test
  void doesNotPersistOrRecordTelemetryWhenTheAuthorizationPortFails() {
    AuthorizationPort port = mock(AuthorizationPort.class);
    AuthorizationAuditRepository repo = mock(AuthorizationAuditRepository.class);
    OperationsTelemetryService telemetry = mock(OperationsTelemetryService.class);
    when(port.check("user:alice", "can_edit", "project:orion"))
        .thenThrow(new RuntimeException("OpenFGA unreachable"));
    AuthorizationService service = new AuthorizationService(port, repo, telemetry);

    assertThatThrownBy(() -> service.check("user:alice", "can_edit", "project:orion"))
        .isInstanceOf(RuntimeException.class)
        .hasMessage("OpenFGA unreachable");

    verifyNoInteractions(repo);
    verifyNoInteractions(telemetry);
  }
}
