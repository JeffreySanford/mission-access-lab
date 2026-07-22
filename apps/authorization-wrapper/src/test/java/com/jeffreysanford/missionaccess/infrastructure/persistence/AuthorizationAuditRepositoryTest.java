package com.jeffreysanford.missionaccess.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

@DataJpaTest
@TestPropertySource(
    properties = {
      "spring.jpa.properties.hibernate.default_schema=authorization_wrapper",
      "spring.jpa.properties.hibernate.hbm2ddl.create_namespaces=true"
    })
class AuthorizationAuditRepositoryTest {

  @Autowired private AuthorizationAuditRepository repository;

  @Test
  void savesAndFindsAnAuditEventInTheAuthorizationWrapperSchema() {
    AuthorizationAuditEvent event =
        new AuthorizationAuditEvent(
            UUID.randomUUID(),
            Instant.now(),
            "user:alice",
            "can_edit",
            "project:orion",
            true,
            12,
            "owner");

    repository.save(event);
    var found = repository.findById(event.getId());

    assertThat(found).isPresent();
    assertThat(found.get().getActor()).isEqualTo("user:alice");
    assertThat(found.get().getRelationName()).isEqualTo("can_edit");
    assertThat(found.get().getResourceName()).isEqualTo("project:orion");
    assertThat(found.get().isAllowed()).isTrue();
    assertThat(found.get().getLatencyMs()).isEqualTo(12);
    assertThat(found.get().getExplanation()).isEqualTo("owner");
  }

  @Test
  void deniedDecisionsRoundTripCorrectly() {
    AuthorizationAuditEvent event =
        new AuthorizationAuditEvent(
            UUID.randomUUID(),
            Instant.now(),
            "user:dave",
            "can_view",
            "document:launch-plan",
            false,
            4,
            "no relationship");

    repository.save(event);
    var found = repository.findById(event.getId());

    assertThat(found).isPresent();
    assertThat(found.get().isAllowed()).isFalse();
  }

  @Test
  void findingAnUnknownIdReturnsEmpty() {
    assertThat(repository.findById(UUID.randomUUID())).isEmpty();
  }
}
