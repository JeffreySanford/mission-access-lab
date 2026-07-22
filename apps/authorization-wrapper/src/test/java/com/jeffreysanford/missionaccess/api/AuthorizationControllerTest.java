package com.jeffreysanford.missionaccess.api;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jeffreysanford.missionaccess.application.AuthorizationService;
import com.jeffreysanford.missionaccess.config.OpenFgaProperties;
import com.jeffreysanford.missionaccess.domain.AuthorizationDecision;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

@WebMvcTest(controllers = AuthorizationController.class)
class AuthorizationControllerTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @MockitoBean private AuthorizationService authorizationService;
  @MockitoBean private OpenFgaProperties openFgaProperties;

  @Test
  void validCheckRequestReturnsTheDecision() throws Exception {
    when(authorizationService.check("user:alice", "can_edit", "project:orion"))
        .thenReturn(new AuthorizationDecision(true, "decision-1", 5, "owner"));

    mockMvc
        .perform(
            post("/api/access/check")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        new AuthorizationController.CheckRequest(
                            "user:alice", "can_edit", "project:orion"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.allowed").value(true))
        .andExpect(jsonPath("$.decisionId").value("decision-1"));
  }

  @Test
  void blankUserIsRejectedWith400() throws Exception {
    mockMvc
        .perform(
            post("/api/access/check")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        new AuthorizationController.CheckRequest("", "can_edit", "project:orion"))))
        .andExpect(status().isBadRequest());
  }

  @Test
  void blankRelationIsRejectedWith400() throws Exception {
    mockMvc
        .perform(
            post("/api/access/check")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        new AuthorizationController.CheckRequest(
                            "user:alice", "", "project:orion"))))
        .andExpect(status().isBadRequest());
  }

  @Test
  void blankObjectIsRejectedWith400() throws Exception {
    mockMvc
        .perform(
            post("/api/access/check")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        new AuthorizationController.CheckRequest("user:alice", "can_edit", ""))))
        .andExpect(status().isBadRequest());
  }

  @Test
  void missingFieldsAreRejectedWith400() throws Exception {
    mockMvc
        .perform(
            post("/api/access/check")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"user\": \"user:alice\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void malformedJsonIsRejectedWith400() throws Exception {
    mockMvc
        .perform(
            post("/api/access/check")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{ this is not valid json"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void diagnosticsReportsLiveWhenStoreAndModelIdsArePresent() throws Exception {
    when(openFgaProperties.storeId()).thenReturn("store-1");
    when(openFgaProperties.modelId()).thenReturn("model-1");
    when(openFgaProperties.baseUrl()).thenReturn("http://openfga:8080");

    mockMvc
        .perform(get("/api/access/diagnostics"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.live").value(true))
        .andExpect(jsonPath("$.storeId").value("store-1"))
        .andExpect(jsonPath("$.modelId").value("model-1"));
  }

  @Test
  void diagnosticsReportsDemoModeWhenStoreIdIsMissing() throws Exception {
    when(openFgaProperties.storeId()).thenReturn("");
    when(openFgaProperties.modelId()).thenReturn("model-1");

    mockMvc.perform(get("/api/access/diagnostics")).andExpect(jsonPath("$.live").value(false));
  }

  @Test
  void diagnosticsReportsDemoModeWhenModelIdIsMissing() throws Exception {
    when(openFgaProperties.storeId()).thenReturn("store-1");
    when(openFgaProperties.modelId()).thenReturn(null);

    mockMvc.perform(get("/api/access/diagnostics")).andExpect(jsonPath("$.live").value(false));
  }
}
