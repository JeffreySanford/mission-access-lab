package com.jeffreysanford.missionaccess.domain;

public interface AuthorizationPort { AuthorizationDecision check(String user, String relation, String object); }
