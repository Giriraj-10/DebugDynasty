package com.intellicare.api.controller;

import com.intellicare.api.model.Appointment;
import com.intellicare.api.model.Doctor;
import com.intellicare.api.model.Patient;
import com.intellicare.api.repository.AppointmentRepository;
import com.intellicare.api.repository.DoctorRepository;
import com.intellicare.api.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/consultations")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class DoctorConsultationController {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    // Get all doctors for patient view
    @GetMapping("/doctors")
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        return ResponseEntity.ok(doctorRepository.findAll());
    }

    // Toggle doctor online status
    @PutMapping("/doctors/{uid}/online-status")
    public ResponseEntity<?> toggleOnlineStatus(@PathVariable String uid, @RequestParam Boolean status) {
        Optional<Doctor> docOpt = doctorRepository.findById(uid);
        if (docOpt.isPresent()) {
            Doctor doc = docOpt.get();
            doc.setOnlineStatus(status);
            doctorRepository.save(doc);
            return ResponseEntity.ok(doc);
        }
        return ResponseEntity.notFound().build();
    }

    // Book an appointment
    @PostMapping("/appointments")
    public ResponseEntity<?> bookAppointment(@RequestBody Map<String, Object> payload) {
        try {
            String patientUid = (String) payload.get("patientUid");
            String doctorUid = (String) payload.get("doctorUid");
            String appointmentDate = (String) payload.get("appointmentDate");
            String timeSlot = (String) payload.get("timeSlot");

            if (patientUid == null || doctorUid == null || appointmentDate == null || timeSlot == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "patientUid, doctorUid, appointmentDate, and timeSlot are required"));
            }

            Appointment appointment = Appointment.builder()
                    .patientUid(patientUid)
                    .doctorUid(doctorUid)
                    .appointmentDate(appointmentDate)
                    .timeSlot(timeSlot)
                    .status("PENDING")
                    .build();

            appointment = appointmentRepository.save(appointment);
            return ResponseEntity.ok(appointment);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    // Get enriched appointments for patient
    @GetMapping("/appointments/patient/{patientUid}")
    public ResponseEntity<List<Map<String, Object>>> getAppointmentsByPatient(@PathVariable String patientUid) {
        List<Appointment> list = appointmentRepository.findByPatientUid(patientUid);
        List<Map<String, Object>> responseList = new ArrayList<>();

        for (Appointment app : list) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", app.getId());
            map.put("patientUid", app.getPatientUid());
            map.put("doctorUid", app.getDoctorUid());
            map.put("appointmentDate", app.getAppointmentDate());
            map.put("timeSlot", app.getTimeSlot());
            map.put("status", app.getStatus());

            // Get doctor profile details
            Optional<Doctor> docOpt = doctorRepository.findById(app.getDoctorUid());
            if (docOpt.isPresent()) {
                Doctor d = docOpt.get();
                map.put("doctorName", d.getFullName());
                map.put("doctorSpecialization", d.getSpecialization());
                map.put("doctorPreferredLanguage", d.getPreferredLanguage());
                map.put("doctorOnlineStatus", d.getOnlineStatus());
            } else {
                map.put("doctorName", "Unknown Doctor");
                map.put("doctorSpecialization", "General Medicine");
            }
            responseList.add(map);
        }
        return ResponseEntity.ok(responseList);
    }

    // Get enriched appointments for doctor
    @GetMapping("/appointments/doctor/{doctorUid}")
    public ResponseEntity<List<Map<String, Object>>> getAppointmentsByDoctor(@PathVariable String doctorUid) {
        List<Appointment> list = appointmentRepository.findByDoctorUid(doctorUid);
        List<Map<String, Object>> responseList = new ArrayList<>();

        for (Appointment app : list) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", app.getId());
            map.put("patientUid", app.getPatientUid());
            map.put("doctorUid", app.getDoctorUid());
            map.put("appointmentDate", app.getAppointmentDate());
            map.put("timeSlot", app.getTimeSlot());
            map.put("status", app.getStatus());

            // Get patient profile details
            Optional<Patient> patOpt = patientRepository.findById(app.getPatientUid());
            if (patOpt.isPresent()) {
                Patient p = patOpt.get();
                map.put("patientName", p.getFullName());
                map.put("patientPhone", p.getPhone());
                map.put("patientAge", p.getAge());
                map.put("patientBloodGroup", p.getBloodGroup());
            } else {
                map.put("patientName", "Unknown Patient");
            }
            responseList.add(map);
        }
        return ResponseEntity.ok(responseList);
    }

    // Update appointment status (Accept / Reject)
    @PutMapping("/appointments/{id}/status")
    public ResponseEntity<?> updateAppointmentStatus(@PathVariable Long id, @RequestParam String status) {
        Optional<Appointment> appOpt = appointmentRepository.findById(id);
        if (appOpt.isPresent()) {
            Appointment app = appOpt.get();
            String upperStatus = status.toUpperCase();
            if (upperStatus.equals("ACCEPTED") || upperStatus.equals("REJECTED") || upperStatus.equals("PENDING")) {
                app.setStatus(upperStatus);
                appointmentRepository.save(app);
                return ResponseEntity.ok(app);
            }
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status value. Allowed: ACCEPTED, REJECTED, PENDING"));
        }
        return ResponseEntity.notFound().build();
    }
}
