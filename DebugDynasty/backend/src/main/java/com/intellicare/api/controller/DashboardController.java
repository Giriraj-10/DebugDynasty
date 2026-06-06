package com.intellicare.api.controller;

import com.intellicare.api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class DashboardController {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private AmbulanceRepository ambulanceRepository;

    @Autowired
    private BloodBankRepository bloodBankRepository;

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(@RequestParam String role, @RequestParam String uid) {
        switch (role.toUpperCase()) {
            case "PATIENT":
                return patientRepository.findById(uid)
                        .map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
            case "DOCTOR":
                return doctorRepository.findById(uid)
                        .map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
            case "HOSPITAL":
                return hospitalRepository.findById(uid)
                        .map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
            case "AMBULANCE":
                return ambulanceRepository.findById(uid)
                        .map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
            case "BLOOD_BANK":
                return bloodBankRepository.findById(uid)
                        .map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
            default:
                return ResponseEntity.badRequest().body("Invalid role specified");
        }
    }
}
