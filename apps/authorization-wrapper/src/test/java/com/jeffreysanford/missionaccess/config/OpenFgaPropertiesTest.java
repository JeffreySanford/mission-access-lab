package com.jeffreysanford.missionaccess.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

class OpenFgaPropertiesTest {

  private final ApplicationContextRunner contextRunner =
      new ApplicationContextRunner().withUserConfiguration(TestConfig.class);

  @Test
  void bindsAllPropertiesFromTheEnvironment() {
    contextRunner
        .withPropertyValues(
            "app.openfga.base-url=http://openfga:8080",
            "app.openfga.store-id=store-1",
            "app.openfga.model-id=model-1",
            "app.openfga.request-timeout=3s")
        .run(
            context -> {
              OpenFgaProperties properties = context.getBean(OpenFgaProperties.class);
              assertThat(properties.baseUrl()).isEqualTo("http://openfga:8080");
              assertThat(properties.storeId()).isEqualTo("store-1");
              assertThat(properties.modelId()).isEqualTo("model-1");
              assertThat(properties.requestTimeout()).isEqualTo(Duration.ofSeconds(3));
            });
  }

  @Test
  void bindsBlankStoreAndModelIdsWhenPropertiesAreEmptyStrings() {
    contextRunner
        .withPropertyValues(
            "app.openfga.base-url=http://openfga:8080",
            "app.openfga.store-id=",
            "app.openfga.model-id=")
        .run(
            context -> {
              OpenFgaProperties properties = context.getBean(OpenFgaProperties.class);
              assertThat(properties.storeId()).isEmpty();
              assertThat(properties.modelId()).isEmpty();
            });
  }

  @Test
  void bindsNullStoreAndModelIdsWhenPropertiesAreAbsent() {
    contextRunner
        .withPropertyValues("app.openfga.base-url=http://openfga:8080")
        .run(
            context -> {
              OpenFgaProperties properties = context.getBean(OpenFgaProperties.class);
              assertThat(properties.storeId()).isNull();
              assertThat(properties.modelId()).isNull();
            });
  }

  @Configuration
  @EnableConfigurationProperties(OpenFgaProperties.class)
  static class TestConfig {}
}
