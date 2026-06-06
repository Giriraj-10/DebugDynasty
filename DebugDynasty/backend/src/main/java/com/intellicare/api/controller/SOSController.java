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
@RequestMapping("/api/sos")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class SOSController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private AmbulanceRepository ambulanceRepository;

    @Autowired
    private EmergencyLogRepository logRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Trigger SOS Emergency workflow.
     * POST /api/sos/trigger
     * Body: { patientUid, latitude, longitude }
     */
    @PostMapping("/trigger")
    @Transactional
    public ResponseEntity<?> triggerSOS(@RequestBody Map<String, Object> payload) {
        try {
            String patientUid = (String) payload.get("patientUid");
            Double patientLat = ((Number) payload.get("latitude")).doubleValue();
            Double patientLon = ((Number) payload.get("longitude")).doubleValue();

            if (patientUid == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "patientUid is required"));
            }

            // 1. Fetch patient
            Optional<Patient> patientOpt = patientRepository.findById(patientUid);
            if (patientOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Patient profile not found"));
            }
            Patient patient = patientOpt.get();

            // 2. Fetch available ambulances
            List<Ambulance> availableAmbulances = ambulanceRepository.findAll().stream()
                    .filter(a -> "AVAILABLE".equalsIgnoreCase(a.getStatus()))
                    .filter(a -> a.getLatitude() != null && a.getLongitude() != null)
                    .toList();

            if (availableAmbulances.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "No available ambulances online. Please contact hotlines."));
            }

            // 3. Calculate nearest ambulance
            Ambulance nearestAmbulance = null;
            double minAmbulanceDistance = Double.MAX_VALUE;
            for (Ambulance ambulance : availableAmbulances) {
                double distance = calculateDistance(patientLat, patientLon, ambulance.getLatitude(), ambulance.getLongitude());
                if (distance < minAmbulanceDistance) {
                    minAmbulanceDistance = distance;
                    nearestAmbulance = ambulance;
                }
            }

            // 4. Fetch hospitals with available beds
            List<Hospital> eligibleHospitals = hospitalRepository.findAll().stream()
                    .filter(h -> h.getAvailableBeds() != null && h.getAvailableBeds() > 0)
                    .filter(h -> h.getLatitude() != null && h.getLongitude() != null)
                    .toList();

            if (eligibleHospitals.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "All nearby hospitals are at maximum bed capacity. Please contact 108."));
            }

            // 5. Calculate nearest hospital
            Hospital nearestHospital = null;
            double minHospitalDistance = Double.MAX_VALUE;
            for (Hospital hospital : eligibleHospitals) {
                double distance = calculateDistance(patientLat, patientLon, hospital.getLatitude(), hospital.getLongitude());
                if (distance < minHospitalDistance) {
                    minHospitalDistance = distance;
                    nearestHospital = hospital;
                }
            }

            if (nearestAmbulance == null || nearestHospital == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Could not calculate routing matches."));
            }

            // 6. Reserve bed at selected hospital
            nearestHospital.setAvailableBeds(nearestHospital.getAvailableBeds() - 1);
            hospitalRepository.save(nearestHospital);

            // 7. Dispatch ambulance
            nearestAmbulance.setStatus("ASSIGNED");
            nearestAmbulance.setAssignedPatientUid(patientUid);
            nearestAmbulance.setAssignedHospitalUid(nearestHospital.getFirebaseUid());
            ambulanceRepository.save(nearestAmbulance);

            // 8. Create Emergency Log
            EmergencyLog log = EmergencyLog.builder()
                    .patientUid(patientUid)
                    .patientLatitude(patientLat)
                    .patientLongitude(patientLon)
                    .ambulanceUid(nearestAmbulance.getFirebaseUid())
                    .hospitalUid(nearestHospital.getFirebaseUid())
                    .status("DISPATCHED")
                    .build();
            log = logRepository.save(log);

            // 9. Prepare payload
            Map<String, Object> response = new HashMap<>();
            response.put("logId", log.getId());
            response.put("status", "DISPATCHED");
            response.put("patientUid", patientUid);
            response.put("patientName", patient.getFullName());
            response.put("patientPhone", patient.getPhone());
            response.put("patientAge", patient.getAge());
            response.put("patientBloodGroup", patient.getBloodGroup());
            response.put("patientLatitude", patientLat);
            response.put("patientLongitude", patientLon);
            
            response.put("ambulanceUid", nearestAmbulance.getFirebaseUid());
            response.put("ambulanceProvider", nearestAmbulance.getProviderName());
            response.put("ambulanceVehicleNumber", nearestAmbulance.getVehicleNumber());
            response.put("ambulanceDriverName", nearestAmbulance.getDriverName());
            response.put("ambulancePhone", nearestAmbulance.getContactNumber());
            response.put("ambulanceLatitude", nearestAmbulance.getLatitude());
            response.put("ambulanceLongitude", nearestAmbulance.getLongitude());
            
            response.put("hospitalUid", nearestHospital.getFirebaseUid());
            response.put("hospitalName", nearestHospital.getHospitalName());
            response.put("hospitalAddress", nearestHospital.getAddress());
            response.put("hospitalPhone", nearestHospital.getContactNumber());
            response.put("hospitalLatitude", nearestHospital.getLatitude());
            response.put("hospitalLongitude", nearestHospital.getLongitude());
            response.put("assignedAt", log.getCreatedAt());

            // 10. Broadcast WS Alert to Hospital
            messagingTemplate.convertAndSend(
                "/topic/hospital/" + nearestHospital.getFirebaseUid() + "/alerts",
                Map.of("type", "SOS_ALERT", "alert", response, "incident", response)
            );

            // 11. Broadcast WS Alert to Ambulance
            messagingTemplate.convertAndSend(
                "/topic/ambulance/" + nearestAmbulance.getFirebaseUid() + "/assignments",
                Map.of("type", "SOS_ASSIGNMENT", "assignment", response, "incident", response)
            );

            // 12. Broadcast WS Alert to Patient status
            messagingTemplate.convertAndSend(
                "/topic/sos/status/" + patientUid,
                Map.of("type", "SOS_STATUS_UPDATE", "incident", response)
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Cancel active SOS log.
     * POST /api/sos/cancel/{logId}
     */
    @PostMapping("/cancel/{logId}")
    @Transactional
    public ResponseEntity<?> cancelSOS(@PathVariable Long logId) {
        Optional<EmergencyLog> logOpt = logRepository.findById(logId);
        if (logOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        EmergencyLog log = logOpt.get();

        if ("DISPATCHED".equalsIgnoreCase(log.getStatus())) {
            log.setStatus("CANCELLED");
            logRepository.save(log);

            // Release Ambulance
            if (log.getAmbulanceUid() != null) {
                ambulanceRepository.findById(log.getAmbulanceUid()).ifPresent(a -> {
                    a.setStatus("AVAILABLE");
                    a.setAssignedPatientUid(null);
                    a.setAssignedHospitalUid(null);
                    ambulanceRepository.save(a);

                    // Notify ambulance of cancellation
                    messagingTemplate.convertAndSend(
                        "/topic/ambulance/" + a.getFirebaseUid() + "/assignments",
                        Map.of("type", "SOS_CANCELLED", "logId", logId)
                    );
                });
            }

            // Release Hospital Bed
            if (log.getHospitalUid() != null) {
                hospitalRepository.findById(log.getHospitalUid()).ifPresent(h -> {
                    h.setAvailableBeds(h.getAvailableBeds() + 1);
                    hospitalRepository.save(h);

                    // Notify hospital of cancellation
                    messagingTemplate.convertAndSend(
                        "/topic/hospital/" + h.getFirebaseUid() + "/alerts",
                        Map.of("type", "SOS_CANCELLED", "logId", logId)
                    );
                });
            }

            // Notify Patient
            messagingTemplate.convertAndSend(
                "/topic/sos/status/" + log.getPatientUid(),
                Map.of("type", "SOS_CANCELLED", "logId", logId)
            );
        }

        return ResponseEntity.ok(Map.of("status", "CANCELLED", "logId", logId));
    }

    /**
     * Complete active SOS mission.
     * POST /api/sos/complete/{logId}
     */
    @PostMapping("/complete/{logId}")
    @Transactional
    public ResponseEntity<?> completeSOS(@PathVariable Long logId) {
        Optional<EmergencyLog> logOpt = logRepository.findById(logId);
        if (logOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        EmergencyLog log = logOpt.get();

        if ("DISPATCHED".equalsIgnoreCase(log.getStatus())) {
            log.setStatus("COMPLETED");
            logRepository.save(log);

            // Release Ambulance
            if (log.getAmbulanceUid() != null) {
                ambulanceRepository.findById(log.getAmbulanceUid()).ifPresent(a -> {
                    a.setStatus("AVAILABLE");
                    a.setAssignedPatientUid(null);
                    a.setAssignedHospitalUid(null);
                    ambulanceRepository.save(a);

                    // Notify ambulance
                    messagingTemplate.convertAndSend(
                        "/topic/ambulance/" + a.getFirebaseUid() + "/assignments",
                        Map.of("type", "SOS_COMPLETED", "logId", logId)
                    );
                });
            }

            // Notify Hospital
            if (log.getHospitalUid() != null) {
                messagingTemplate.convertAndSend(
                    "/topic/hospital/" + log.getHospitalUid() + "/alerts",
                    Map.of("type", "SOS_COMPLETED", "logId", logId)
                );
            }

            // Notify Patient
            messagingTemplate.convertAndSend(
                "/topic/sos/status/" + log.getPatientUid(),
                Map.of("type", "SOS_COMPLETED", "logId", logId)
            );
        }

        return ResponseEntity.ok(Map.of("status", "COMPLETED", "logId", logId));
    }

    /**
     * Get active SOS for a Patient.
     */
    @GetMapping("/active/patient/{patientUid}")
    public ResponseEntity<?> getActivePatientSOS(@PathVariable String patientUid) {
        List<String> activeStatuses = Arrays.asList("DISPATCHED", "EN_ROUTE", "ACKNOWLEDGED");
        Optional<EmergencyLog> activeLog = logRepository.findFirstByPatientUidAndStatusInOrderByIdDesc(patientUid, activeStatuses);
        if (activeLog.isEmpty()) {
            return ResponseEntity.ok(Map.of("active", false));
        }
        return ResponseEntity.ok(Map.of("active", true, "incident", enrichIncidentDetails(activeLog.get())));
    }

    /**
     * Get active SOS assignment for an Ambulance.
     */
    @GetMapping("/active/ambulance/{ambulanceUid}")
    public ResponseEntity<?> getActiveAmbulanceSOS(@PathVariable String ambulanceUid) {
        List<String> activeStatuses = Arrays.asList("DISPATCHED", "EN_ROUTE", "ACKNOWLEDGED");
        Optional<EmergencyLog> activeLog = logRepository.findFirstByAmbulanceUidAndStatusInOrderByIdDesc(ambulanceUid, activeStatuses);
        if (activeLog.isEmpty()) {
            return ResponseEntity.ok(Map.of("active", false));
        }
        return ResponseEntity.ok(Map.of("active", true, "incident", enrichIncidentDetails(activeLog.get())));
    }

    /**
     * Get active incoming emergencies for a Hospital.
     */
    @GetMapping("/active/hospital/{hospitalUid}")
    public ResponseEntity<?> getActiveHospitalSOS(@PathVariable String hospitalUid) {
        List<EmergencyLog> activeLogs = logRepository.findByHospitalUidAndStatus(hospitalUid, "DISPATCHED");
        List<Map<String, Object>> enriched = activeLogs.stream().map(this::enrichIncidentDetails).toList();
        return ResponseEntity.ok(enriched);
    }

    /**
     * Update bed numbers for a Hospital.
     * PUT /api/sos/hospitals/{hospitalUid}/beds
     */
    @PutMapping("/hospitals/{hospitalUid}/beds")
    @Transactional
    public ResponseEntity<?> updateHospitalBeds(@PathVariable String hospitalUid, @RequestBody Map<String, Integer> payload) {
        Optional<Hospital> hospOpt = hospitalRepository.findById(hospitalUid);
        if (hospOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Hospital hospital = hospOpt.get();
        if (payload.containsKey("totalBeds")) {
            hospital.setTotalBeds(payload.get("totalBeds"));
        }
        if (payload.containsKey("availableBeds")) {
            hospital.setAvailableBeds(payload.get("availableBeds"));
        }
        hospitalRepository.save(hospital);
        return ResponseEntity.ok(hospital);
    }

    // Helper to calculate basic 2D Euclidean distance
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
    }

    // Helper to enrich log payload with details
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
