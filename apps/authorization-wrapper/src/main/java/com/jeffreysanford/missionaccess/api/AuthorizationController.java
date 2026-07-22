package com.jeffreysanford.missionaccess.api;

import com.jeffreysanford.missionaccess.application.AuthorizationService;
import com.jeffreysanford.missionaccess.config.OpenFgaProperties;
import com.jeffreysanford.missionaccess.domain.AuthorizationDecision;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/access")
public class AuthorizationController {
  private final AuthorizationService authorizationService;
  private final OpenFgaProperties openFgaProperties;

  public AuthorizationController(
      AuthorizationService authorizationService, OpenFgaProperties openFgaProperties) {
    this.authorizationService = authorizationService;
    this.openFgaProperties = openFgaProperties;
  }

  @PostMapping("/check")
  ResponseEntity<AuthorizationDecision> check(@Valid @RequestBody CheckRequest request) {
    return ResponseEntity.ok(
        authorizationService.check(request.user(), request.relation(), request.object()));
  }

  @GetMapping("/diagnostics")
  ResponseEntity<Diagnostics> diagnostics() {
    boolean live =
        StringUtils.hasText(openFgaProperties.storeId())
            && StringUtils.hasText(openFgaProperties.modelId());
    return ResponseEntity.ok(
        new Diagnostics(
            live,
            openFgaProperties.baseUrl(),
            openFgaProperties.storeId(),
            openFgaProperties.modelId()));
  }

  public record CheckRequest(
      @NotBlank String user, @NotBlank String relation, @NotBlank String object) {}

  public record Diagnostics(boolean live, String openfgaBaseUrl, String storeId, String modelId) {}
}
