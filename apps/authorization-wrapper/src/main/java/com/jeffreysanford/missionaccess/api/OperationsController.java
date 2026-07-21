package com.jeffreysanford.missionaccess.api;
import com.jeffreysanford.missionaccess.operations.OperationsSnapshot;
import com.jeffreysanford.missionaccess.operations.OperationsTelemetryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController @RequestMapping("/api/operations")
public class OperationsController { private final OperationsTelemetryService telemetry; public OperationsController(OperationsTelemetryService telemetry){this.telemetry=telemetry;} @GetMapping("/snapshot") OperationsSnapshot snapshot(){return telemetry.snapshot();} }
