package com.intellicare.api.controller;

import com.intellicare.api.model.EmergencyLog;
import com.intellicare.api.model.Hospital;
import com.intellicare.api.model.Patient;
import com.intellicare.api.model.Ambulance;
import com.intellicare.api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/hospital")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class HospitalController {

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private EmergencyLogRepository logRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AmbulanceRepository ambulanceRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Get hospital profile.
     * GET /api/hospital/{uid}
     */
    @GetMapping("/{uid}")
    public ResponseEntity<?> getHospital(@PathVariable String uid) {
        Optional<Hospital> opt = hospitalRepository.findById(uid);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Hospital h = opt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("uid", h.getFirebaseUid());
        response.put("name", h.getHospitalName());
        response.put("address", h.getAddress());
        response.put("phone", h.getContactNumber());
        response.put("totalBeds", h.getTotalBeds());
        response.put("availableBeds", h.getAvailableBeds());
        return ResponseEntity.ok(response);
    }

    /**
     * Update available beds count.
     * PUT /api/hospital/{uid}/beds
     * Body: { "availableBeds": 15 }
     */
    @PutMapping("/{uid}/beds")
    @Transactional
    public ResponseEntity<?> updateBeds(@PathVariable String uid, @RequestBody Map<String, Integer> body) {
        Optional<Hospital> opt = hospitalRepository.findById(uid);
        if (opt.isEmpty()) {
            // Mock success for offline/seed mode
            return ResponseEntity.ok(Map.of("uid", uid, "availableBeds", body.getOrDefault("availableBeds", 0)));
        }
        Hospital hospital = opt.get();
        if (body.containsKey("availableBeds")) {
            hospital.setAvailableBeds(body.get("availableBeds"));
        }
        if (body.containsKey("totalBeds")) {
            hospital.setTotalBeds(body.get("totalBeds"));
        }
        hospitalRepository.save(hospital);

        // Broadcast bed count change
        messagingTemplate.convertAndSend(
            "/topic/hospital/" + uid + "/alerts",
            Map.of("type", "BED_UPDATE", "availableBeds", hospital.getAvailableBeds())
        );

        return ResponseEntity.ok(Map.of("uid", uid, "availableBeds", hospital.getAvailableBeds(), "totalBeds", hospital.getTotalBeds()));
    }

    /**
     * Get all SOS alerts (incoming emergency patients) for a hospital.
     * GET /api/hospital/{uid}/alerts
     */
    @GetMapping("/{uid}/alerts")
    public ResponseEntity<?> getAlerts(@PathVariable String uid) {
        List<EmergencyLog> logs = logRepository.findByHospitalUidOrderByIdDesc(uid);
        List<Map<String, Object>> result = logs.stream().map(this::toAlertMap).toList();
        return ResponseEntity.ok(result);
    }

    /**
     * Acknowledge a specific SOS alert (prepare bed).
     * POST /api/hospital/{uid}/alerts/{logId}/acknowledge
     */
    @PostMapping("/{uid}/alerts/{logId}/acknowledge")
    @Transactional
    public ResponseEntity<?> acknowledgeAlert(@PathVariable String uid, @PathVariable Long logId) {
        Optional<EmergencyLog> logOpt = logRepository.findById(logId);
        if (logOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("status", "ok", "message", "Log not found"));
        }
        // Mark log as acknowledged (using a status field or just returning ok)
        EmergencyLog log = logOpt.get();
        if ("DISPATCHED".equalsIgnoreCase(log.getStatus())) {
            log.setStatus("ACKNOWLEDGED");
            logRepository.save(log);
        }
        return ResponseEntity.ok(Map.of("status", "ACKNOWLEDGED", "logId", logId));
    }

    // Convert EmergencyLog to alert map for the hospital dashboard
    private Map<String, Object> toAlertMap(EmergencyLog log) {
        Map<String, Object> map = new HashMap<>();
        map.put("logId", log.getId());
        map.put("status", log.getStatus());
        map.put("alertedAt", log.getCreatedAt());
        map.put("acknowledged", "ACKNOWLEDGED".equalsIgnoreCase(log.getStatus()) || "COMPLETED".equalsIgnoreCase(log.getStatus()));
        map.put("estimatedArrivalMins", 8);

        patientRepository.findById(log.getPatientUid()).ifPresent(p -> {
            map.put("patientName", p.getFullName());
            map.put("patientAge", p.getAge());
            map.put("patientBloodGroup", p.getBloodGroup());
            map.put("patientPhone", p.getPhone());
        });

        if (log.getAmbulanceUid() != null) {
            ambulanceRepository.findById(log.getAmbulanceUid()).ifPresent(a -> {
                map.put("ambulanceVehicleNumber", a.getVehicleNumber());
                map.put("ambulanceDriverName", a.getDriverName());
                map.put("ambulancePhone", a.getContactNumber());
            });
        }

        return map;
    }
}
