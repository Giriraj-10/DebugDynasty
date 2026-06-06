package com.intellicare.api.controller;

import com.intellicare.api.model.*;
import com.intellicare.api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/prescriptions")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class PrescriptionController {

    @Autowired private PrescriptionRepository prescriptionRepository;
    @Autowired private DoctorRepository doctorRepository;
    @Autowired private PatientRepository patientRepository;

    /** POST /api/prescriptions — doctor submits a prescription */
    @PostMapping
    @Transactional
    public ResponseEntity<?> createPrescription(@RequestBody Map<String, String> body) {
        try {
            String patientUid    = body.get("patientUid");
            String doctorUid     = body.get("doctorUid");
            String medicines     = body.get("medicines");
            String dosage        = body.get("dosage");
            String instructions  = body.get("instructions");
            String duration      = body.get("duration");

            if (patientUid == null || doctorUid == null || medicines == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Missing required fields"));
            }

            Prescription p = Prescription.builder()
                    .patientUid(patientUid)
                    .doctorUid(doctorUid)
                    .medicines(medicines)
                    .dosage(dosage != null ? dosage : "")
                    .instructions(instructions != null ? instructions : "")
                    .duration(duration != null ? duration : "")
                    .build();
            p = prescriptionRepository.save(p);
            return ResponseEntity.ok(enrichPrescription(p));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    /** GET /api/prescriptions/patient/{uid} — patient's prescription history */
    @GetMapping("/patient/{uid}")
    public ResponseEntity<?> getPatientPrescriptions(@PathVariable String uid) {
        List<Prescription> list = prescriptionRepository.findByPatientUidOrderByIdDesc(uid);
        List<Map<String, Object>> result = list.stream().map(this::enrichPrescription).toList();
        return ResponseEntity.ok(result);
    }

    /** GET /api/prescriptions/doctor/{uid} — prescriptions issued by a doctor */
    @GetMapping("/doctor/{uid}")
    public ResponseEntity<?> getDoctorPrescriptions(@PathVariable String uid) {
        List<Prescription> list = prescriptionRepository.findByDoctorUidOrderByIdDesc(uid);
        List<Map<String, Object>> result = list.stream().map(this::enrichPrescription).toList();
        return ResponseEntity.ok(result);
    }

    /** GET /api/prescriptions/patients — list all patients for doctor's dropdown */
    @GetMapping("/patients")
    public ResponseEntity<?> getAllPatients() {
        List<Patient> patients = patientRepository.findAll();
        List<Map<String, Object>> result = patients.stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("uid", p.getFirebaseUid());
            m.put("fullName", p.getFullName());
            m.put("phone", p.getPhone());
            m.put("bloodGroup", p.getBloodGroup());
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    private Map<String, Object> enrichPrescription(Prescription p) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", p.getId());
        m.put("patientUid", p.getPatientUid());
        m.put("doctorUid", p.getDoctorUid());
        m.put("medicines", p.getMedicines());
        m.put("dosage", p.getDosage());
        m.put("instructions", p.getInstructions());
        m.put("duration", p.getDuration());
        m.put("createdAt", p.getCreatedAt());

        doctorRepository.findById(p.getDoctorUid()).ifPresent(d -> {
            m.put("doctorName", d.getFullName());
            m.put("doctorSpecialization", d.getSpecialization());
        });

        patientRepository.findById(p.getPatientUid()).ifPresent(pat -> {
            m.put("patientName", pat.getFullName());
        });

        return m;
    }
}
