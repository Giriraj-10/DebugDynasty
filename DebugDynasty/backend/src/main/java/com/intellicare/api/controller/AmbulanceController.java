package com.intellicare.api.controller;

import com.intellicare.api.model.*;
import com.intellicare.api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/ambulance")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AmbulanceController {

    @Autowired
    private AmbulanceRepository ambulanceRepository;

    @Autowired
    private EmergencyLogRepository logRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Get ambulance profile.
     * GET /api/ambulance/{uid}
     */
    @GetMapping("/{uid}")
    public ResponseEntity<?> getAmbulance(@PathVariable String uid) {
        return ambulanceRepository.findById(uid)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Update ambulance status (AVAILABLE, BUSY, OFFLINE).
     * PUT /api/ambulance/{uid}/status
     * Body: { "status": "AVAILABLE" }
     */
    @PutMapping("/{uid}/status")
    @Transactional
    public ResponseEntity<?> updateStatus(@PathVariable String uid, @RequestBody Map<String, String> body) {
        Optional<Ambulance> opt = ambulanceRepository.findById(uid);
        if (opt.isEmpty()) {
            // Simulate success in mock mode
            return ResponseEntity.ok(Map.of("uid", uid, "status", body.getOrDefault("status", "AVAILABLE")));
        }
        Ambulance ambulance = opt.get();
        ambulance.setStatus(body.getOrDefault("status", "AVAILABLE"));
        ambulanceRepository.save(ambulance);
        return ResponseEntity.ok(ambulance);
    }

    /**
     * Accept an SOS assignment.
     * POST /api/ambulance/{uid}/accept/{logId}
     */
    @PostMapping("/{uid}/accept/{logId}")
    @Transactional
    public ResponseEntity<?> acceptAssignment(@PathVariable String uid, @PathVariable Long logId) {
        Optional<EmergencyLog> logOpt = logRepository.findById(logId);
        if (logOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("status", "ok", "message", "Log not found, treating as accepted"));
        }
        EmergencyLog log = logOpt.get();
        log.setStatus("EN_ROUTE");
        logRepository.save(log);

        // Notify patient with full enriched details
        Map<String, Object> incident = enrichIncidentDetails(log);
        messagingTemplate.convertAndSend(
            "/topic/sos/status/" + log.getPatientUid(),
            Map.of("type", "SOS_STATUS_UPDATE", "incident", incident, "status", "EN_ROUTE", "logId", logId)
        );

        return ResponseEntity.ok(Map.of("status", "EN_ROUTE", "logId", logId));
    }

    /**
     * Decline an SOS assignment.
     * POST /api/ambulance/{uid}/decline/{logId}
     */
    @PostMapping("/{uid}/decline/{logId}")
    @Transactional
    public ResponseEntity<?> declineAssignment(@PathVariable String uid, @PathVariable Long logId) {
        Optional<Ambulance> opt = ambulanceRepository.findById(uid);
        opt.ifPresent(a -> {
            a.setStatus("AVAILABLE");
            ambulanceRepository.save(a);
        });
        return ResponseEntity.ok(Map.of("status", "DECLINED", "logId", logId));
    }

    /**
     * Complete an SOS assignment (patient delivered).
     * POST /api/ambulance/{uid}/complete/{logId}
     */
    @PostMapping("/{uid}/complete/{logId}")
    @Transactional
    public ResponseEntity<?> completeAssignment(@PathVariable String uid, @PathVariable Long logId) {
        Optional<EmergencyLog> logOpt = logRepository.findById(logId);
        if (logOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("status", "COMPLETED", "logId", logId));
        }
        EmergencyLog log = logOpt.get();
        log.setStatus("COMPLETED");
        logRepository.save(log);

        // Release ambulance
        ambulanceRepository.findById(uid).ifPresent(a -> {
            a.setStatus("AVAILABLE");
            a.setAssignedPatientUid(null);
            a.setAssignedHospitalUid(null);
            ambulanceRepository.save(a);
        });

        // Notify patient
        messagingTemplate.convertAndSend(
            "/topic/sos/status/" + log.getPatientUid(),
            Map.of("type", "SOS_COMPLETED", "logId", logId)
        );

        // Notify hospital
        if (log.getHospitalUid() != null) {
            messagingTemplate.convertAndSend(
                "/topic/hospital/" + log.getHospitalUid() + "/alerts",
                Map.of("type", "SOS_COMPLETED", "logId", logId)
            );
        }

        return ResponseEntity.ok(Map.of("status", "COMPLETED", "logId", logId));
    }

    /**
     * Update live GPS location.
     * PUT /api/ambulance/{uid}/location
     * Body: { "latitude": 19.0760, "longitude": 72.8777 }
     */
    @PutMapping("/{uid}/location")
    @Transactional
    public ResponseEntity<?> updateLocation(@PathVariable String uid, @RequestBody Map<String, Double> body) {
        ambulanceRepository.findById(uid).ifPresent(a -> {
            a.setLatitude(body.get("latitude"));
            a.setLongitude(body.get("longitude"));
            ambulanceRepository.save(a);
        });

        // Broadcast live location to subscribers
        Map<String, Object> locationMsg = new HashMap<>();
        locationMsg.put("type", "LOCATION_UPDATE");
        locationMsg.put("ambulanceUid", uid);
        locationMsg.put("latitude", body.get("latitude"));
        locationMsg.put("longitude", body.get("longitude"));

        messagingTemplate.convertAndSend("/topic/ambulance/" + uid + "/location", locationMsg);

        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    private Map<String, Object> enrichIncidentDetails(EmergencyLog log) {
        Map<String, Object> details = new HashMap<>();
        details.put("logId", log.getId());
        details.put("status", log.getStatus());
        details.put("patientUid", log.getPatientUid());
        details.put("patientLatitude", log.getPatientLatitude());
        details.put("patientLongitude", log.getPatientLongitude());
        details.put("createdAt", log.getCreatedAt());

        patientRepository.findById(log.getPatientUid()).ifPresent(p -> {
            details.put("patientName", p.getFullName());
            details.put("patientPhone", p.getPhone());
            details.put("patientAge", p.getAge());
            details.put("patientBloodGroup", p.getBloodGroup());
        });

        if (log.getAmbulanceUid() != null) {
            ambulanceRepository.findById(log.getAmbulanceUid()).ifPresent(a -> {
                details.put("ambulanceUid", a.getFirebaseUid());
                details.put("ambulanceProvider", a.getProviderName());
                details.put("ambulanceVehicleNumber", a.getVehicleNumber());
                details.put("ambulanceDriverName", a.getDriverName());
                details.put("ambulancePhone", a.getContactNumber());
                details.put("ambulanceLatitude", a.getLatitude());
                details.put("ambulanceLongitude", a.getLongitude());
            });
        }

        if (log.getHospitalUid() != null) {
            hospitalRepository.findById(log.getHospitalUid()).ifPresent(h -> {
                details.put("hospitalUid", h.getFirebaseUid());
                details.put("hospitalName", h.getHospitalName());
                details.put("hospitalAddress", h.getAddress());
                details.put("hospitalPhone", h.getContactNumber());
                details.put("hospitalLatitude", h.getLatitude());
                details.put("hospitalLongitude", h.getLongitude());
            });
        }

        return details;
    }
}
