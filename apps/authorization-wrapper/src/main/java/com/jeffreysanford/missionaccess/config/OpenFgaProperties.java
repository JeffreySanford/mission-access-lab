package com.jeffreysanford.missionaccess.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.openfga")
public record OpenFgaProperties(String baseUrl, String storeId, String modelId, Duration requestTimeout) {}
