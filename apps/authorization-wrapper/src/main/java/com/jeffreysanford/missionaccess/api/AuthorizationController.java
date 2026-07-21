package com.jeffreysanford.missionaccess.api;

import com.jeffreysanford.missionaccess.application.AuthorizationService;
import com.jeffreysanford.missionaccess.domain.AuthorizationDecision;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController @RequestMapping("/api/access")
public class AuthorizationController {
    private final AuthorizationService authorizationService;
    public AuthorizationController(AuthorizationService authorizationService) { this.authorizationService = authorizationService; }
    @PostMapping("/check") ResponseEntity<AuthorizationDecision> check(@Valid @RequestBody CheckRequest request) { return ResponseEntity.ok(authorizationService.check(request.user(), request.relation(), request.object())); }
    public record CheckRequest(@NotBlank String user, @NotBlank String relation, @NotBlank String object) {}
}
