package com.jeffreysanford.missionaccess.domain;

public record AuthorizationDecision(
    boolean allowed, String decisionId, long latencyMs, String explanation) {}
