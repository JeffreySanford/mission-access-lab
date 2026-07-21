package com.jeffreysanford.missionaccess.application;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import com.jeffreysanford.missionaccess.domain.*;
import com.jeffreysanford.missionaccess.infrastructure.persistence.AuthorizationAuditRepository;
import com.jeffreysanford.missionaccess.operations.OperationsTelemetryService;
import org.junit.jupiter.api.Test;
class AuthorizationServiceTest {
 @Test void persistsAndRecordsTheDecision(){AuthorizationPort port=mock(AuthorizationPort.class);AuthorizationAuditRepository repo=mock(AuthorizationAuditRepository.class);OperationsTelemetryService telemetry=mock(OperationsTelemetryService.class);when(port.check("user:alice","can_edit","document:launch-plan")).thenReturn(new AuthorizationDecision(true,"decision-1",12,"owner"));AuthorizationService service=new AuthorizationService(port,repo,telemetry);AuthorizationDecision result=service.check("user:alice","can_edit","document:launch-plan");assertThat(result.allowed()).isTrue();verify(repo).save(any());verify(telemetry).recordDecision("user:alice","can_edit","document:launch-plan",result);}
}
