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
@RequestMapping("/api/blood")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class BloodNetworkController {

    @Autowired private BloodBankRepository bloodBankRepository;
    @Autowired private BloodRequestRepository bloodRequestRepository;
    @Autowired private HospitalRepository hospitalRepository;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    // ─── Blood Bank Endpoints ────────────────────────────────────────────────

    /** GET /api/blood/banks — list all blood banks with inventory */
    @GetMapping("/banks")
    public ResponseEntity<?> getAllBanks() {
        List<BloodBank> banks = bloodBankRepository.findAll();
        List<Map<String, Object>> result = banks.stream().map(this::toInventoryMap).toList();
        return ResponseEntity.ok(result);
    }

    /** GET /api/blood/banks/{uid} — single blood bank */
    @GetMapping("/banks/{uid}")
    public ResponseEntity<?> getBank(@PathVariable String uid) {
        Optional<BloodBank> opt = bloodBankRepository.findById(uid);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(toInventoryMap(opt.get()));
    }

    /** PUT /api/blood/banks/{uid}/inventory — update stock levels */
    @PutMapping("/banks/{uid}/inventory")
    @Transactional
    public ResponseEntity<?> updateInventory(@PathVariable String uid,
                                             @RequestBody Map<String, Integer> body) {
        Optional<BloodBank> opt = bloodBankRepository.findById(uid);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        BloodBank bb = opt.get();
        if (body.containsKey("aPositive"))  bb.setAPositive(body.get("aPositive"));
        if (body.containsKey("aNegative"))  bb.setANegative(body.get("aNegative"));
        if (body.containsKey("bPositive"))  bb.setBPositive(body.get("bPositive"));
        if (body.containsKey("bNegative"))  bb.setBNegative(body.get("bNegative"));
        if (body.containsKey("abPositive")) bb.setAbPositive(body.get("abPositive"));
        if (body.containsKey("abNegative")) bb.setAbNegative(body.get("abNegative"));
        if (body.containsKey("oPositive"))  bb.setOPositive(body.get("oPositive"));
        if (body.containsKey("oNegative"))  bb.setONegative(body.get("oNegative"));
        bloodBankRepository.save(bb);
        return ResponseEntity.ok(toInventoryMap(bb));
    }

    // ─── Blood Request Endpoints ─────────────────────────────────────────────

    /** POST /api/blood/request — hospital creates a request, notifies blood bank via WS */
    @PostMapping("/request")
    @Transactional
    public ResponseEntity<?> createRequest(@RequestBody Map<String, Object> body) {
        try {
            String hospitalUid   = (String) body.get("hospitalUid");
            String bloodBankUid  = (String) body.get("bloodBankUid");
            String bloodGroup    = (String) body.get("bloodGroup");
            int requiredUnits    = ((Number) body.get("requiredUnits")).intValue();

            if (hospitalUid == null || bloodBankUid == null || bloodGroup == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Missing required fields"));
            }

            BloodRequest req = BloodRequest.builder()
                    .hospitalUid(hospitalUid)
                    .bloodBankUid(bloodBankUid)
                    .bloodGroup(bloodGroup)
                    .requiredUnits(requiredUnits)
                    .status("PENDING")
                    .build();
            req = bloodRequestRepository.save(req);

            // Enrich with hospital details and broadcast to blood bank
            Map<String, Object> notification = buildNotification(req);
            messagingTemplate.convertAndSend(
                "/topic/bloodbank/" + bloodBankUid + "/requests",
                Map.of("type", "BLOOD_REQUEST", "request", notification)
            );

            return ResponseEntity.ok(notification);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    /** GET /api/blood/requests/hospital/{uid} — requests made by a hospital */
    @GetMapping("/requests/hospital/{uid}")
    public ResponseEntity<?> getHospitalRequests(@PathVariable String uid) {
        List<BloodRequest> requests = bloodRequestRepository.findByHospitalUidOrderByIdDesc(uid);
        List<Map<String, Object>> result = requests.stream().map(this::buildNotification).toList();
        return ResponseEntity.ok(result);
    }

    /** GET /api/blood/requests/bloodbank/{uid} — requests received by a blood bank */
    @GetMapping("/requests/bloodbank/{uid}")
    public ResponseEntity<?> getBloodBankRequests(@PathVariable String uid) {
        List<BloodRequest> requests = bloodRequestRepository.findByBloodBankUidOrderByIdDesc(uid);
        List<Map<String, Object>> result = requests.stream().map(this::buildNotification).toList();
        return ResponseEntity.ok(result);
    }

    /** POST /api/blood/requests/{id}/accept — accept, deduct stock, notify hospital */
    @PostMapping("/requests/{id}/accept")
    @Transactional
    public ResponseEntity<?> acceptRequest(@PathVariable Long id) {
        Optional<BloodRequest> opt = bloodRequestRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        BloodRequest req = opt.get();

        // Deduct inventory
        bloodBankRepository.findById(req.getBloodBankUid()).ifPresent(bb -> {
            deductStock(bb, req.getBloodGroup(), req.getRequiredUnits());
            bloodBankRepository.save(bb);
        });

        req.setStatus("ACCEPTED");
        bloodRequestRepository.save(req);

        Map<String, Object> notification = buildNotification(req);
        // Notify hospital
        messagingTemplate.convertAndSend(
            "/topic/hospital/" + req.getHospitalUid() + "/blood",
            Map.of("type", "BLOOD_ACCEPTED", "request", notification)
        );

        return ResponseEntity.ok(notification);
    }

    /** POST /api/blood/requests/{id}/reject — reject and notify hospital */
    @PostMapping("/requests/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectRequest(@PathVariable Long id) {
        Optional<BloodRequest> opt = bloodRequestRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        BloodRequest req = opt.get();
        req.setStatus("REJECTED");
        bloodRequestRepository.save(req);

        Map<String, Object> notification = buildNotification(req);
        messagingTemplate.convertAndSend(
            "/topic/hospital/" + req.getHospitalUid() + "/blood",
            Map.of("type", "BLOOD_REJECTED", "request", notification)
        );

        return ResponseEntity.ok(notification);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Map<String, Object> toInventoryMap(BloodBank bb) {
        Map<String, Object> m = new HashMap<>();
        m.put("uid", bb.getFirebaseUid());
        m.put("name", bb.getBloodBankName());
        m.put("address", bb.getAddress());
        m.put("phone", bb.getContactNumber());
        m.put("aPositive",  bb.getAPositive());
        m.put("aNegative",  bb.getANegative());
        m.put("bPositive",  bb.getBPositive());
        m.put("bNegative",  bb.getBNegative());
        m.put("abPositive", bb.getAbPositive());
        m.put("abNegative", bb.getAbNegative());
        m.put("oPositive",  bb.getOPositive());
        m.put("oNegative",  bb.getONegative());
        return m;
    }

    private Map<String, Object> buildNotification(BloodRequest req) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", req.getId());
        m.put("hospitalUid", req.getHospitalUid());
        m.put("bloodBankUid", req.getBloodBankUid());
        m.put("bloodGroup", req.getBloodGroup());
        m.put("requiredUnits", req.getRequiredUnits());
        m.put("status", req.getStatus());
        m.put("createdAt", req.getCreatedAt());

        hospitalRepository.findById(req.getHospitalUid()).ifPresent(h -> {
            m.put("hospitalName", h.getHospitalName());
            m.put("hospitalAddress", h.getAddress());
            m.put("hospitalPhone", h.getContactNumber());
        });

        bloodBankRepository.findById(req.getBloodBankUid()).ifPresent(bb -> {
            m.put("bloodBankName", bb.getBloodBankName());
        });

        return m;
    }

    private void deductStock(BloodBank bb, String group, int units) {
        switch (group) {
            case "A+"  -> bb.setAPositive(Math.max(0, bb.getAPositive() - units));
            case "A-"  -> bb.setANegative(Math.max(0, bb.getANegative() - units));
            case "B+"  -> bb.setBPositive(Math.max(0, bb.getBPositive() - units));
            case "B-"  -> bb.setBNegative(Math.max(0, bb.getBNegative() - units));
            case "AB+" -> bb.setAbPositive(Math.max(0, bb.getAbPositive() - units));
            case "AB-" -> bb.setAbNegative(Math.max(0, bb.getAbNegative() - units));
            case "O+"  -> bb.setOPositive(Math.max(0, bb.getOPositive() - units));
            case "O-"  -> bb.setONegative(Math.max(0, bb.getONegative() - units));
        }
    }
}
