package com.jeffreysanford.missionaccess.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(OpenFgaProperties.class)
public class ApplicationConfiguration {
    @Bean RestClient openFgaRestClient(RestClient.Builder builder, OpenFgaProperties properties) {
        return builder.baseUrl(properties.baseUrl()).build();
    }
}
