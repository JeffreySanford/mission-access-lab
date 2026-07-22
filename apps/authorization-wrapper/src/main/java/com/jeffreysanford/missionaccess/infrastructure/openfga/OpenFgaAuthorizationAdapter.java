package com.jeffreysanford.missionaccess.infrastructure.openfga;

import com.jeffreysanford.missionaccess.config.OpenFgaProperties;
import com.jeffreysanford.missionaccess.domain.AuthorizationDecision;
import com.jeffreysanford.missionaccess.domain.AuthorizationPort;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class OpenFgaAuthorizationAdapter implements AuthorizationPort {
  private final RestClient restClient;
  private final OpenFgaProperties properties;

  public OpenFgaAuthorizationAdapter(RestClient openFgaRestClient, OpenFgaProperties properties) {
    this.restClient = openFgaRestClient;
    this.properties = properties;
  }

  @Override
  public AuthorizationDecision check(String user, String relation, String object) {
    if (!StringUtils.hasText(properties.storeId()) || !StringUtils.hasText(properties.modelId())) {
      boolean demoAllowed =
          user.equals("user:alice") || (user.equals("user:bob") && relation.equals("can_view"));
      return new AuthorizationDecision(
          demoAllowed,
          UUID.randomUUID().toString(),
          1,
          "Demo decision: run npm run fga:bootstrap and export the returned IDs for live OpenFGA calls.");
    }
    Instant started = Instant.now();
    Map<String, Object> request =
        Map.of(
            "authorization_model_id",
            properties.modelId(),
            "tuple_key",
            Map.of("user", user, "relation", relation, "object", object));
    OpenFgaCheckResponse response;
    try {
      response =
          restClient
              .post()
              .uri("/stores/{storeId}/check", properties.storeId())
              .body(request)
              .retrieve()
              .body(OpenFgaCheckResponse.class);
    } catch (HttpClientErrorException e) {
      // 4xx: our request was malformed (e.g. an invalid object/relation identifier).
      // Fail closed rather than surfacing an opaque 500 to the caller.
      return new AuthorizationDecision(
          false,
          UUID.randomUUID().toString(),
          Duration.between(started, Instant.now()).toMillis(),
          "OpenFGA rejected the request: " + e.getStatusText());
    } catch (RestClientException e) {
      // 5xx or a connection failure: OpenFGA itself is unavailable. Fail closed here too.
      return new AuthorizationDecision(
          false,
          UUID.randomUUID().toString(),
          Duration.between(started, Instant.now()).toMillis(),
          "OpenFGA is unavailable: " + e.getMessage());
    }
    long latency = Duration.between(started, Instant.now()).toMillis();
    boolean allowed = response != null && response.allowed();
    return new AuthorizationDecision(
        allowed,
        UUID.randomUUID().toString(),
        latency,
        allowed
            ? "OpenFGA found a valid relationship path."
            : "OpenFGA found no relationship path granting this relation.");
  }

  private record OpenFgaCheckResponse(boolean allowed) {}
}
