package com.jeffreysanford.missionaccess.infrastructure.openfga;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withNoContent;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.jeffreysanford.missionaccess.config.OpenFgaProperties;
import com.jeffreysanford.missionaccess.domain.AuthorizationDecision;
import java.io.IOException;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class OpenFgaAuthorizationAdapterTest {

  private OpenFgaAuthorizationAdapter adapterWithServer(
      OpenFgaProperties properties, MockRestServiceServer[] serverOut) {
    RestClient.Builder builder = RestClient.builder().baseUrl(properties.baseUrl());
    serverOut[0] = MockRestServiceServer.bindTo(builder).build();
    return new OpenFgaAuthorizationAdapter(builder.build(), properties);
  }

  @Test
  void demoModeAllowsAliceWithoutCallingOpenFga() {
    OpenFgaProperties properties =
        new OpenFgaProperties("http://openfga:8080", "", "", Duration.ofSeconds(2));
    MockRestServiceServer[] serverOut = new MockRestServiceServer[1];
    OpenFgaAuthorizationAdapter adapter = adapterWithServer(properties, serverOut);

    AuthorizationDecision decision = adapter.check("user:alice", "can_edit", "project:orion");

    assertThat(decision.allowed()).isTrue();
    assertThat(decision.explanation()).contains("Demo decision");
    serverOut[0].verify();
  }

  @Test
  void demoModeAllowsBobOnlyForCanView() {
    OpenFgaProperties properties = new OpenFgaProperties("http://openfga:8080", null, null, null);
    MockRestServiceServer[] serverOut = new MockRestServiceServer[1];
    OpenFgaAuthorizationAdapter adapter = adapterWithServer(properties, serverOut);

    assertThat(adapter.check("user:bob", "can_view", "project:orion").allowed()).isTrue();
    assertThat(adapter.check("user:bob", "can_edit", "project:orion").allowed()).isFalse();
    serverOut[0].verify();
  }

  @Test
  void demoModeDeniesUnknownUser() {
    OpenFgaProperties properties = new OpenFgaProperties("http://openfga:8080", "", "", null);
    MockRestServiceServer[] serverOut = new MockRestServiceServer[1];
    OpenFgaAuthorizationAdapter adapter = adapterWithServer(properties, serverOut);

    assertThat(adapter.check("user:dave", "can_view", "project:orion").allowed()).isFalse();
    serverOut[0].verify();
  }

  @Test
  void liveModeUsesDemoFallbackOnlyWhenStoreIdOrModelIdIsBlank() {
    OpenFgaProperties missingModelId =
        new OpenFgaProperties("http://openfga:8080", "store-1", "", null);
    MockRestServiceServer[] serverOut = new MockRestServiceServer[1];
    OpenFgaAuthorizationAdapter adapter = adapterWithServer(missingModelId, serverOut);

    AuthorizationDecision decision = adapter.check("user:carol", "can_edit", "project:orion");

    assertThat(decision.explanation()).contains("Demo decision");
    serverOut[0].verify();
  }

  @Test
  void liveModeReturnsAllowWhenOpenFgaGrantsTheRelation() {
    OpenFgaProperties properties =
        new OpenFgaProperties("http://openfga:8080", "store-1", "model-1", Duration.ofSeconds(2));
    MockRestServiceServer[] serverOut = new MockRestServiceServer[1];
    OpenFgaAuthorizationAdapter adapter = adapterWithServer(properties, serverOut);
    serverOut[0]
        .expect(requestTo("http://openfga:8080/stores/store-1/check"))
        .andExpect(method(HttpMethod.POST))
        .andRespond(withSuccess("{\"allowed\": true}", MediaType.APPLICATION_JSON));

    AuthorizationDecision decision = adapter.check("user:carol", "can_edit", "project:orion");

    assertThat(decision.allowed()).isTrue();
    assertThat(decision.explanation()).isEqualTo("OpenFGA found a valid relationship path.");
    assertThat(decision.decisionId()).isNotBlank();
    serverOut[0].verify();
  }

  @Test
  void liveModeReturnsDenyWhenOpenFgaRejectsTheRelation() {
    OpenFgaProperties properties =
        new OpenFgaProperties("http://openfga:8080", "store-1", "model-1", Duration.ofSeconds(2));
    MockRestServiceServer[] serverOut = new MockRestServiceServer[1];
    OpenFgaAuthorizationAdapter adapter = adapterWithServer(properties, serverOut);
    serverOut[0]
        .expect(requestTo("http://openfga:8080/stores/store-1/check"))
        .andExpect(method(HttpMethod.POST))
        .andRespond(withSuccess("{\"allowed\": false}", MediaType.APPLICATION_JSON));

    AuthorizationDecision decision = adapter.check("user:dave", "can_view", "document:launch-plan");

    assertThat(decision.allowed()).isFalse();
    assertThat(decision.explanation())
        .isEqualTo("OpenFGA found no relationship path granting this relation.");
    serverOut[0].verify();
  }

  @Test
  void liveModeTreatsEmptyResponseBodyAsDenied() {
    OpenFgaProperties properties =
        new OpenFgaProperties("http://openfga:8080", "store-1", "model-1", Duration.ofSeconds(2));
    MockRestServiceServer[] serverOut = new MockRestServiceServer[1];
    OpenFgaAuthorizationAdapter adapter = adapterWithServer(properties, serverOut);
    serverOut[0]
        .expect(requestTo("http://openfga:8080/stores/store-1/check"))
        .andExpect(method(HttpMethod.POST))
        .andRespond(withNoContent());

    AuthorizationDecision decision = adapter.check("user:carol", "can_edit", "project:orion");

    assertThat(decision.allowed()).isFalse();
    serverOut[0].verify();
  }

  @Test
  void liveModeFailsClosedWhenOpenFgaRejectsAMalformedRequest() {
    OpenFgaProperties properties =
        new OpenFgaProperties("http://openfga:8080", "store-1", "model-1", Duration.ofSeconds(2));
    MockRestServiceServer[] serverOut = new MockRestServiceServer[1];
    OpenFgaAuthorizationAdapter adapter = adapterWithServer(properties, serverOut);
    serverOut[0]
        .expect(requestTo("http://openfga:8080/stores/store-1/check"))
        .andExpect(method(HttpMethod.POST))
        .andRespond(
            withStatus(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .body(
                    "{\"code\":\"validation_error\",\"message\":\"invalid 'object' field format\"}"));

    AuthorizationDecision decision = adapter.check("user:alice", "can_edit", "not-a-valid-object");

    assertThat(decision.allowed()).isFalse();
    assertThat(decision.explanation()).contains("OpenFGA rejected the request");
    serverOut[0].verify();
  }

  @Test
  void liveModeFailsClosedWhenOpenFgaReturnsAServerError() {
    OpenFgaProperties properties =
        new OpenFgaProperties("http://openfga:8080", "store-1", "model-1", Duration.ofSeconds(2));
    MockRestServiceServer[] serverOut = new MockRestServiceServer[1];
    OpenFgaAuthorizationAdapter adapter = adapterWithServer(properties, serverOut);
    serverOut[0]
        .expect(requestTo("http://openfga:8080/stores/store-1/check"))
        .andExpect(method(HttpMethod.POST))
        .andRespond(withServerError());

    AuthorizationDecision decision = adapter.check("user:carol", "can_edit", "project:orion");

    assertThat(decision.allowed()).isFalse();
    assertThat(decision.explanation()).contains("OpenFGA is unavailable");
    serverOut[0].verify();
  }

  @Test
  void liveModeFailsClosedOnConnectionFailure() {
    OpenFgaProperties properties =
        new OpenFgaProperties("http://openfga:8080", "store-1", "model-1", Duration.ofSeconds(2));
    MockRestServiceServer[] serverOut = new MockRestServiceServer[1];
    OpenFgaAuthorizationAdapter adapter = adapterWithServer(properties, serverOut);
    serverOut[0]
        .expect(requestTo("http://openfga:8080/stores/store-1/check"))
        .andExpect(method(HttpMethod.POST))
        .andRespond(
            request -> {
              throw new IOException("simulated network timeout");
            });

    AuthorizationDecision decision = adapter.check("user:carol", "can_edit", "project:orion");

    assertThat(decision.allowed()).isFalse();
    assertThat(decision.explanation()).contains("OpenFGA is unavailable");
    serverOut[0].verify();
  }
}
