package com.intellicare.api.controller;

import com.intellicare.api.model.*;
import com.intellicare.api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/followup")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FollowUpController {

    @Autowired private MedicineTrackerRepository trackerRepository;
    @Autowired private PrescriptionRepository prescriptionRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private DoctorRepository doctorRepository;

    /** POST /api/followup/medicine — patient saves a medicine tracker entry */
    @PostMapping("/medicine")
    @Transactional
    public ResponseEntity<?> addMedicine(@RequestBody Map<String, String> body) {
        try {
            String patientUid   = body.get("patientUid");
            String medicineName = body.get("medicineName");
            String dosage       = body.get("dosage");
            String frequency    = body.get("frequency");
            String duration     = body.get("duration");

            if (patientUid == null || medicineName == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Missing required fields"));
            }

            MedicineTracker entry = MedicineTracker.builder()
                    .patientUid(patientUid)
                    .medicineName(medicineName)
                    .dosage(dosage != null ? dosage : "")
                    .frequency(frequency != null ? frequency : "")
                    .duration(duration != null ? duration : "")
                    .build();
            entry = trackerRepository.save(entry);
            return ResponseEntity.ok(toMap(entry));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    /** GET /api/followup/medicine/patient/{uid} — list tracked medicines */
    @GetMapping("/medicine/patient/{uid}")
    public ResponseEntity<?> getMedicines(@PathVariable String uid) {
        List<MedicineTracker> list = trackerRepository.findByPatientUidOrderByIdDesc(uid);
        List<Map<String, Object>> result = list.stream().map(this::toMap).toList();
        return ResponseEntity.ok(result);
    }

    /** DELETE /api/followup/medicine/{id} — remove a tracker entry */
    @DeleteMapping("/medicine/{id}")
    @Transactional
    public ResponseEntity<?> deleteMedicine(@PathVariable Long id) {
        trackerRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "deleted", "id", id));
    }

    /** GET /api/followup/reminders/patient/{uid} — unified reminder list */
    @GetMapping("/reminders/patient/{uid}")
    public ResponseEntity<?> getReminders(@PathVariable String uid) {
        List<Map<String, Object>> reminders = new ArrayList<>();

        // Upcoming accepted appointments
        appointmentRepository.findByPatientUidOrderByIdDesc(uid).stream()
            .filter(a -> "ACCEPTED".equalsIgnoreCase(a.getStatus()))
            .forEach(a -> {
                Map<String, Object> r = new HashMap<>();
                r.put("type", "APPOINTMENT");
                r.put("id", a.getId());
                r.put("title", "Appointment with Dr. " + a.getDoctorUid());
                r.put("date", a.getAppointmentDate());
                r.put("time", a.getTimeSlot());

                doctorRepository.findById(a.getDoctorUid()).ifPresent(d -> {
                    r.put("title", "Appointment with Dr. " + d.getFullName());
                    r.put("doctorName", d.getFullName());
                    r.put("specialization", d.getSpecialization());
                });

                reminders.add(r);
            });

        // Medicine reminders from tracker
        trackerRepository.findByPatientUidOrderByIdDesc(uid).forEach(m -> {
            Map<String, Object> r = new HashMap<>();
            r.put("type", "MEDICINE");
            r.put("id", m.getId());
            r.put("title", m.getMedicineName());
            r.put("dosage", m.getDosage());
            r.put("frequency", m.getFrequency());
            r.put("duration", m.getDuration());
            r.put("createdAt", m.getCreatedAt());
            reminders.add(r);
        });

        // Medicine reminders from active prescriptions (most recent)
        prescriptionRepository.findByPatientUidOrderByIdDesc(uid).stream()
            .limit(3)
            .forEach(p -> {
                // Each prescription medicine becomes a reminder line
                String[] meds = p.getMedicines().split(";");
                for (String med : meds) {
                    if (med.trim().isEmpty()) continue;
                    Map<String, Object> r = new HashMap<>();
                    r.put("type", "PRESCRIPTION_MED");
                    r.put("id", "rx-" + p.getId());
                    r.put("title", med.trim());
                    r.put("dosage", p.getDosage());
                    r.put("frequency", "As prescribed");
                    r.put("duration", p.getDuration());
                    r.put("prescriptionId", p.getId());
                    r.put("createdAt", p.getCreatedAt());

                    doctorRepository.findById(p.getDoctorUid()).ifPresent(d ->
                        r.put("doctorName", d.getFullName())
                    );
                    reminders.add(r);
                }
            });

        return ResponseEntity.ok(reminders);
    }

    private Map<String, Object> toMap(MedicineTracker m) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", m.getId());
        map.put("patientUid", m.getPatientUid());
        map.put("medicineName", m.getMedicineName());
        map.put("dosage", m.getDosage());
        map.put("frequency", m.getFrequency());
        map.put("duration", m.getDuration());
        map.put("createdAt", m.getCreatedAt());
        return map;
    }
}
